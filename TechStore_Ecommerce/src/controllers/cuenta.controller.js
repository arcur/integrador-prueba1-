// src/controllers/cuenta.controller.js

const Usuario = require('../models/usuario.model');
const Pedido = require('../models/pedido.model');

const cuentaController = {};

/**
 * Muestra la página principal de "Mi Cuenta".
 * (GET /mi-cuenta)
 */
cuentaController.mostrarMiCuenta = async (req, res) => {
    try {
        const id_usuario = req.session.user.id_usuario; // Obtenido del usuario logueado
        const perfil = await Usuario.getProfileById(id_usuario);

        if (!perfil) {
            req.flash('error_msg', 'No se pudo cargar tu información.');
            return res.redirect('/'); // Redirigir si hay error
        }

        res.render('mi-cuenta', {
            title: 'Mi Cuenta - TechStore',
            perfil: perfil
            // success_msg y error_msg ya están disponibles globalmente
        });

    } catch (error) {
        console.error('Error al mostrar Mi Cuenta:', error);
        req.flash('error_msg', 'Error al cargar tu cuenta.');
        res.redirect('/');
    }
};

/**
 * Muestra la página "Mis Pedidos".
 * (GET /mis-pedidos)
 */
cuentaController.mostrarMisPedidos = async (req, res) => {
    try {
        const id_usuario = req.session.user.id_usuario;
        const pedidos = await Pedido.getByUserId(id_usuario);

        res.render('mis-pedidos', {
            title: 'Mis Pedidos - TechStore',
            pedidos: pedidos
        });

    } catch (error) {
        console.error('Error al mostrar Mis Pedidos:', error);
        req.flash('error_msg', 'Error al cargar tus pedidos.');
        res.redirect('/mi-cuenta'); // Redirigir a Mi Cuenta si falla
    }
};


cuentaController.mostrarDetallePedidoCliente = async (req, res) => {
    try {
        const id_pedido = req.params.id;
        const id_usuario = req.session.user.id_usuario; // ID del usuario logueado

        const data = await Pedido.getDetalleById(id_pedido);

        // --- Verificación de Seguridad ---
        // 1. ¿Existe el pedido?
        // 2. ¿Pertenece este pedido al usuario logueado?
        if (!data || data.pedido.id_usuario !== id_usuario) { // Asegúrate que tu modelo devuelva id_usuario en data.pedido
            req.flash('error_msg', 'Pedido no encontrado o no tienes permiso para verlo.');
            return res.redirect('/mis-pedidos');
        }
        // --- Fin Verificación ---


        res.render('pedido_detalle_cliente', { // Nueva vista
            title: `Detalle de tu Pedido #${id_pedido}`,
            pedido: data.pedido,
            detalles: data.detalles
            // Mensajes flash ya disponibles
        });

    } catch (error) {
        console.error('Error al mostrar detalle de pedido cliente:', error);
        req.flash('error_msg', 'Error al cargar el detalle del pedido.');
        res.redirect('/mis-pedidos');
    }
};

// ===============================================
// --- ¡NUEVO! EDITAR PERFIL ---
// ===============================================

/**
 * Muestra el formulario para Editar Perfil.
 * (GET /editar-perfil)
 */
cuentaController.mostrarFormularioEditarPerfil = async (req, res) => {
    try {
        const id_usuario = req.session.user.id_usuario;
        const perfil = await Usuario.getProfileById(id_usuario); // Usamos la función que ya teníamos

        if (!perfil) {
            req.flash('error_msg', 'No se pudo cargar tu información para editar.');
            return res.redirect('/mi-cuenta');
        }

        res.render('editar-perfil', { // Nueva vista
            title: 'Editar Mi Perfil - TechStore',
            perfil: perfil, // Pasamos datos actuales para rellenar el form
            errors: [], // Para mostrar errores de validación
            formData: perfil // Usar datos actuales como formData inicial
        });

    } catch (error) {
        console.error('Error al mostrar formulario editar perfil:', error);
        req.flash('error_msg', 'Error al cargar el formulario de edición.');
        res.redirect('/mi-cuenta');
    }
};

/**
 * Procesa la actualización del perfil.
 * (POST /editar-perfil)
 */
cuentaController.procesarEditarPerfil = async (req, res) => {
    const id_usuario = req.session.user.id_usuario;
    const { nombre, apellido_paterno, apellido_materno, telefono, correo, usuario } = req.body;
    const errors = [];

    // --- Validación Simple (similar a registro, pero sin contraseña/edad) ---
    const regexLetras = /^[A-Za-z\sñáéíóúÁÉÍÓÚ]+$/;
    if (!nombre || !regexLetras.test(nombre)) errors.push('El nombre solo debe contener letras.');
    if (!apellido_paterno || !regexLetras.test(apellido_paterno)) errors.push('El apellido paterno solo debe contener letras.');
    if (!apellido_materno || !regexLetras.test(apellido_materno)) errors.push('El apellido materno solo debe contener letras.');
    const regexTelefono = /^[0-9+]*$/;
    if (telefono && !regexTelefono.test(telefono)) errors.push('El teléfono solo debe contener números y "+".');
    const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!correo || !regexCorreo.test(correo)) errors.push('El formato del correo no es válido.');
    if (!usuario || usuario.length < 3) errors.push('El nombre de usuario debe tener al menos 3 caracteres.');
    // --- Fin Validación ---

    if (errors.length > 0) {
        // Si hay errores de validación, volver a mostrar el formulario
        // Necesitamos recargar los datos originales para no perder DNI, etc.
         const perfilOriginal = await Usuario.getProfileById(id_usuario);
         return res.render('editar-perfil', {
            title: 'Editar Mi Perfil - TechStore',
            perfil: perfilOriginal, // Datos originales
            errors: errors,
            formData: req.body // Rellenar con los datos fallidos enviados
        });
    }

    try {
        // Intentar actualizar usando el modelo (maneja duplicados)
        await Usuario.updateProfile(id_usuario, {
            nombre, apellido_paterno, apellido_materno, telefono, correo, usuario
        });

        // ¡Importante! Actualizar el nombre en la sesión si cambió
        if (req.session.user.nombre !== nombre) {
            req.session.user.nombre = nombre;
        }

        req.flash('success_msg', 'Perfil actualizado exitosamente.');
        res.redirect('/mi-cuenta');

    } catch (error) { // Captura errores del modelo (ej: duplicados) o de BD
        console.error('Error al actualizar perfil:', error);
        errors.push(error.message || 'Error al guardar los cambios en la base de datos.');
        // Volver a mostrar el formulario con el error
        const perfilOriginal = await Usuario.getProfileById(id_usuario);
        res.render('editar-perfil', {
            title: 'Editar Mi Perfil - TechStore',
            perfil: perfilOriginal,
            errors: errors,
            formData: req.body
        });
    }
};


module.exports = cuentaController;