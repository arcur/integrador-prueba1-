// src/controllers/auth.controller.js
// (VERSIÓN FINAL COMPLETA - Con carga de carrito persistente simplificada y mensajes flash en registro/login)

const Usuario = require('../models/usuario.model');
const bcrypt = require('bcryptjs');
const Carrito = require('../models/carrito.model'); // Asegúrate de tener este require
const Producto = require('../models/producto.model'); // Necesario para validar productos cargados
const { inicializarCarrito, recalcularTotal } = require('../utils/cart.utils'); // Necesario

const authController = {};

// --- REGISTRO ---
authController.mostrarRegistro = (req, res) => {
    res.render('registro', {
        title: 'Registro - TechStore',
        errors: [],
        formData: {}
    });
};

authController.procesarRegistro = async (req, res) => {
    const { nombre, apellido_paterno, apellido_materno,
            numero_dni, telefono, correo, usuario, contraseña,
            fecha_nacimiento } = req.body;
    const errors = [];

    // --- Validación ---
    const regexLetras = /^[A-Za-z\sñáéíóúÁÉÍÓÚ]+$/;
    if (!nombre || !regexLetras.test(nombre)) errors.push('El nombre solo debe contener letras.');
    if (!apellido_paterno || !regexLetras.test(apellido_paterno)) errors.push('El apellido paterno solo debe contener letras.');
    if (!apellido_materno || !regexLetras.test(apellido_materno)) errors.push('El apellido materno solo debe contener letras.');
    const regexDNI = /^[0-9]{8}$/;
    if (!numero_dni || !regexDNI.test(numero_dni)) errors.push('El DNI debe contener exactamente 8 números.');
    const regexTelefono = /^[0-9+]*$/;
    if (telefono && !regexTelefono.test(telefono)) errors.push('El teléfono solo debe contener números y "+".');
    if (!contraseña || contraseña.length < 6) errors.push('La contraseña debe tener al menos 6 caracteres.');
    const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!correo || !regexCorreo.test(correo)) errors.push('El formato del correo electrónico no es válido.');
    if (!usuario) errors.push('El nombre de usuario es obligatorio.'); // Añadir validación de usuario
    if (!fecha_nacimiento) { errors.push('La fecha de nacimiento es obligatoria.'); }
    else {
        try {
            const hoy = new Date();
            const fechaNac = new Date(fecha_nacimiento);
            if (isNaN(fechaNac.getTime())) { // Verifica si la fecha es válida
                 errors.push('La fecha de nacimiento no es válida.');
            } else {
                let edad = hoy.getFullYear() - fechaNac.getFullYear();
                const mes = hoy.getMonth() - fechaNac.getMonth();
                if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) { edad--; }
                if (edad < 18) { errors.push('Debes ser mayor de 18 años para registrarte.'); }
            }
        } catch(dateError) {
             errors.push('Error al procesar la fecha de nacimiento.');
        }
    }
    // --- Fin Validación ---

    if (errors.length > 0) {
        return res.render('registro', {
            title: 'Registro - TechStore',
            errors: errors,
            formData: req.body
        });
    }

    try {
        // Asegúrate que tu modelo Usuario.create acepte fecha_nacimiento si es necesario
        await Usuario.create({
            nombre, apellido_paterno, apellido_materno,
            numero_dni, telefono, correo, usuario, contraseña, fecha_nacimiento 
        });

        // --- ÉXITO ---
        req.flash('success_msg', '¡Registro exitoso! Ya puedes iniciar sesión.');
        res.redirect('/login');

    } catch (error) {
        console.error('Error al registrar en BD:', error);
        let errorMsg = 'Ocurrió un error inesperado al crear la cuenta.';
        if (error.code === 'ER_DUP_ENTRY') {
            if (error.sqlMessage.includes('usuario.numero_dni')) {
                 errorMsg = 'El DNI ingresado ya se encuentra registrado.';
            } else if (error.sqlMessage.includes('usuario.correo')) {
                 errorMsg = 'El correo electrónico ingresado ya se encuentra registrado.';
            } else if (error.sqlMessage.includes('usuario.usuario')) {
                 errorMsg = 'El nombre de usuario ingresado ya se encuentra registrado.';
            } else {
                 errorMsg = 'El DNI, correo o nombre de usuario ya se encuentran registrados.';
            }
        }
        
        // --- ERROR ---
        req.flash('error_msg', errorMsg);
        // Redirigir de vuelta al registro para mostrar error y mantener datos
        // Opcional: podrías redirigir a /login si prefieres
         res.render('registro', {
            title: 'Registro - TechStore',
            errors: [errorMsg], // Mostrar el error específico
            formData: req.body // Mantener los datos ingresados
        });
        // res.redirect('/login'); // Si prefieres redirigir a login
    }
};


// --- LOGIN ---
authController.mostrarLogin = (req, res) => {
    res.render('login', {
        title: 'Iniciar Sesión - TechStore',
        // Los mensajes flash (success_msg, error_msg) se pasan automáticamente
        // a través del middleware global si está configurado.
        // Pasamos query params explícitamente si existen (para mensajes post-logout/delete)
        query: req.query 
    });
};

authController.procesarLogin = async (req, res) => {
    const { usuario, contraseña } = req.body;

    // Validación simple de entrada
    if (!usuario || !contraseña) {
         req.flash('error_msg', 'Debes ingresar usuario y contraseña.');
         return res.redirect('/login');
    }

    try {
        const user = await Usuario.findByUsername(usuario); // Busca por usuario o correo

        // Verifica usuario, estado y contraseña
        if (!user || user.estado !== 'Activo' || !(await bcrypt.compare(contraseña, user.contraseña))) {
            req.flash('error_msg', 'Usuario o contraseña incorrectos o cuenta inactiva.');
            return res.redirect('/login');
        }

        // --- Usuario autenticado correctamente ---
      req.session.user = {
            id_usuario: user.id_usuario,
            nombre: user.nombre,
            rol: user.rol,
            correo: user.correo 
        };

        // --- Lógica del Carrito Persistente ---
        const sessionCart = inicializarCarrito(req);
        const dbCartId = await Carrito.findOrCreateActiveCart(user.id_usuario);
        req.session.dbCartId = dbCartId;

        const dbItems = await Carrito.getItems(dbCartId);

        if (dbItems.length > 0) {
            sessionCart.items = []; // Limpiar antes de cargar
            for (const dbItem of dbItems) {
                const productoDB = await Producto.getById(dbItem.id_producto);
                if (productoDB && productoDB.stock >= dbItem.cantidad && dbItem.cantidad > 0) {
                    sessionCart.items.push({
                        id_producto: productoDB.id_producto,
                        nombre_producto: productoDB.nombre_producto,
                        precio: productoDB.precio,
                        imagen: productoDB.imagen,
                        cantidad: dbItem.cantidad,
                        stock_disponible: productoDB.stock
                    });
                } else {
                    console.warn(`[Login User ${user.id_usuario}] Removing invalid item from DB cart: Product ID ${dbItem.id_producto}`);
                    await Carrito.removeItem(dbCartId, dbItem.id_producto);
                }
            }
            recalcularTotal(sessionCart);
        } else {
             sessionCart.items = []; // Asegurar que esté vacío si no hay nada en BD
             sessionCart.total = 0;
        }
        // --- Fin Lógica Carrito ---

        console.log(`[Login User ${user.id_usuario}] DB Cart ID: ${req.session.dbCartId}`);
        console.log(`[Login User ${user.id_usuario}] Session Cart Items Loaded:`, JSON.stringify(sessionCart.items, null, 2));
        console.log(`[Login User ${user.id_usuario}] Session Cart Total: ${sessionCart.total}`);

        // Redirección según rol
        if (user.rol === 'Admin' || user.rol === 'MainAdmin') {
            res.redirect('/admin/dashboard');
        } else {
            // Redirigir al carrito si tiene items, si no al inicio
            res.redirect(sessionCart.items.length > 0 ? '/carrito' : '/');
        }

    } catch (error) {
        console.error('Error en el login:', error);
        req.flash('error_msg', 'Error interno del servidor durante el login.');
        res.redirect('/login');
    }
};


// --- LOGOUT ---
authController.cerrarSesion = (req, res) => {
    req.session.destroy(err => {
        res.clearCookie('connect.sid'); // Limpiar cookie siempre
        if (err) {
            console.error('Error al cerrar sesión:', err);
             // Redirigir a login incluso si falla la destrucción
             return res.redirect('/login?error=Ocurrió un error al cerrar tu sesión.');
        }
        // Usamos query param para el mensaje post-logout
        res.redirect('/login?success=Has cerrado sesión exitosamente.');
    });
};

module.exports = authController;