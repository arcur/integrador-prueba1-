// src/controllers/auth.controller.js
// (VERSIÓN FINAL COMPLETA - Con carga de carrito persistente simplificada)

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

    // --- Validación (igual que antes) ---
    const regexLetras = /^[A-Za-z\sñáéíóúÁÉÍÓÚ]+$/;
    if (!regexLetras.test(nombre)) errors.push('El nombre solo debe contener letras.');
    if (!regexLetras.test(apellido_paterno)) errors.push('El apellido paterno solo debe contener letras.');
    if (!regexLetras.test(apellido_materno)) errors.push('El apellido materno solo debe contener letras.');
    const regexDNI = /^[0-9]{8}$/;
    if (!regexDNI.test(numero_dni)) errors.push('El DNI debe contener exactamente 8 números.');
    const regexTelefono = /^[0-9+]*$/;
    if (telefono && !regexTelefono.test(telefono)) errors.push('El teléfono solo debe contener números y "+".');
    if (!contraseña || contraseña.length < 6) errors.push('La contraseña debe tener al menos 6 caracteres.');
    const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regexCorreo.test(correo)) errors.push('El formato del correo electrónico no es válido.');
    if (!fecha_nacimiento) { errors.push('La fecha de nacimiento es obligatoria.'); }
    else {
        const hoy = new Date(); const fechaNac = new Date(fecha_nacimiento);
        let edad = hoy.getFullYear() - fechaNac.getFullYear();
        const mes = hoy.getMonth() - fechaNac.getMonth();
        if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) { edad--; }
        if (edad < 18) { errors.push('Debes ser mayor de 18 años para registrarte.'); }
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
        await Usuario.create({
            nombre, apellido_paterno, apellido_materno,
            numero_dni, telefono, correo, usuario, contraseña
        });
        // Usar mensaje flash para éxito
        req.flash('success_msg', '¡Registro exitoso! Ya puedes iniciar sesión.');
        res.redirect('/login');

    } catch (error) {
        console.error('Error al registrar en BD:', error);
        let errorMsg = 'Ocurrió un error inesperado al crear la cuenta.';
        if (error.code === 'ER_DUP_ENTRY') {
            errorMsg = 'El DNI, correo o nombre de usuario ya se encuentran registrados.';
        }
        // Usar mensaje flash para error y redirigir (pierde datos del form)
        req.flash('error_msg', errorMsg);
        res.redirect('/registro');
        // Alternativa: re-renderizar manteniendo datos (más complejo con flash)
        /*
        res.render('registro', {
            title: 'Registro - TechStore',
            errors: [errorMsg], // Mostrar el error específico
            formData: req.body
        });
        */
    }
};


// --- LOGIN ---
authController.mostrarLogin = (req, res) => {
    // Lee mensajes flash (ya configurado en server.js)
    res.render('login', {
        title: 'Iniciar Sesión - TechStore'
        // error_msg y success_msg ya están disponibles globalmente
    });
};

/**
 * Procesa las credenciales de login (POST /login)
 * (VERSIÓN CORRECTA - Carga carrito de BD, SIN fusión anónima)
 */
authController.procesarLogin = async (req, res) => {
    const { usuario, contraseña } = req.body;

    try {
        const user = await Usuario.findByUsername(usuario);

        // Verifica usuario, estado y contraseña en una sola condición
        if (!user || user.estado !== 'Activo' || !(await bcrypt.compare(contraseña, user.contraseña))) {
            req.flash('error_msg', 'Usuario o contraseña incorrectos o cuenta inactiva.');
            return res.redirect('/login');
        }

        // --- INICIO LÓGICA CARRITO PERSISTENTE (Simplificada) ---

        // 1. Establecer sesión del usuario
        req.session.user = {
            id_usuario: user.id_usuario,
            nombre: user.nombre,
            rol: user.rol
        };

        // 2. Inicializar carrito de sesión (vacío)
        const sessionCart = inicializarCarrito(req); // Crea req.session.cart = { items: [], total: 0 }

        // 3. Buscar/Crear carrito en BD y obtener su ID
        const dbCartId = await Carrito.findOrCreateActiveCart(user.id_usuario);
        req.session.dbCartId = dbCartId; // Guardar ID de BD en sesión

        // 4. Cargar items del carrito de la BD
        const dbItems = await Carrito.getItems(dbCartId);

        // 5. Poblar carrito de sesión con items de BD (validando)
        if (dbItems.length > 0) {
            for (const dbItem of dbItems) {
                const productoDB = await Producto.getById(dbItem.id_producto);
                // Solo añadir si el producto existe, tiene stock suficiente y cantidad > 0
                if (productoDB && productoDB.stock >= dbItem.cantidad && dbItem.cantidad > 0) {
                    sessionCart.items.push({
                        id_producto: productoDB.id_producto,
                        nombre_producto: productoDB.nombre_producto,
                        precio: productoDB.precio, // Precio actual
                        imagen: productoDB.imagen,
                        cantidad: dbItem.cantidad,
                        stock_disponible: productoDB.stock
                    });
                } else {
                    // Si no cumple, eliminarlo de la BD para mantener consistencia
                    console.warn(`[Login User ${user.id_usuario}] Removing invalid item from DB cart: Product ID ${dbItem.id_producto}`);
                    await Carrito.removeItem(dbCartId, dbItem.id_producto);
                }
            }
            recalcularTotal(sessionCart); // Recalcular total de sesión
        }

        // --- LOGS PARA DEPURAR CARGA DE CARRITO ---
        console.log(`[Login User ${user.id_usuario}] DB Cart ID: ${req.session.dbCartId}`);
        console.log(`[Login User ${user.id_usuario}] Session Cart Items Loaded:`, JSON.stringify(sessionCart.items, null, 2));
        console.log(`[Login User ${user.id_usuario}] Session Cart Total: ${sessionCart.total}`);
        // --- FIN LOGS ---

        // --- FIN LÓGICA CARRITO ---

        req.flash('success_msg', `¡Bienvenido de nuevo, ${user.nombre}!`);

        if (user.rol === 'Admin' || user.rol === 'MainAdmin') {
            res.redirect('/admin/dashboard');
        } else {
            // Redirigir al carrito si tiene items cargados, si no al inicio
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
    // El carrito en BD NO se borra aquí
    req.session.destroy(err => {
        if (err) {
            console.error('Error al cerrar sesión:', err);
            // Intentar limpiar cookie incluso si hay error
            res.clearCookie('connect.sid'); // 'connect.sid' es el nombre default de la cookie de sesión
            return res.redirect('/'); // Redirigir al inicio en caso de error
        }
        res.clearCookie('connect.sid');
        // Opcional: Redirigir con mensaje de éxito
        // req.flash('success_msg', 'Has cerrado sesión exitosamente.'); // No funcionará porque la sesión se destruyó
        res.redirect('/login'); // Redirigir a login
    });
};

module.exports = authController;