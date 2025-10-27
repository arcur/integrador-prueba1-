// src/controllers/cuenta.controller.js
// ACTUALIZADO para usar nuevas vistas y añadir lógica faltante

const Usuario = require('../models/usuario.model');
const Pedido = require('../models/pedido.model');
const bcrypt = require('bcryptjs'); // Necesario para cambiar contraseña

const cuentaController = {};

/**
 * Muestra el Dashboard principal de "Mi Cuenta".
 * (GET /cuenta)
 */
cuentaController.mostrarCuentaDashboard = async (req, res) => {
    try {
        const id_usuario = req.session.user.id_usuario;

        const [pedidos, perfil] = await Promise.all([
             Pedido.getByUserId(id_usuario),
             Usuario.getProfileById(id_usuario) // Necesario para el nombre en el mensaje
        ]);

        const ultimoPedido = pedidos.length > 0 ? pedidos[0] : null;
        const statsCompras = {
            totalPedidos: pedidos.length,
            valorTotal: pedidos.filter(p => ['Pagado', 'Enviado'].includes(p.estado))
                             .reduce((sum, p) => sum + p.total, 0)
        };

        res.render('cuenta_dashboard', {
            title: 'Mi Dashboard',
            // user ya se pasa globalmente por el middleware de ruta
            perfil: perfil, // Para mostrar nombre, etc.
            ultimoPedido: ultimoPedido,
            statsCompras: statsCompras,
            currentPage: 'dashboard' // Para el sidebar activo
        });

    } catch (error) {
        console.error('Error al mostrar Dashboard de Cuenta:', error);
        req.flash('error_msg', 'Error al cargar tu dashboard.');
        res.redirect('/');
    }
};

/**
 * Muestra la página "Mis Pedidos".
 * (GET /cuenta/pedidos)
 */
cuentaController.mostrarCuentaMisPedidos = async (req, res) => {
    try {
        const id_usuario = req.session.user.id_usuario;
        const pedidos = await Pedido.getByUserId(id_usuario);

        res.render('cuenta_mis_pedidos', {
            title: 'Mis Pedidos',
            // user ya se pasa globalmente
            pedidos: pedidos,
            currentPage: 'pedidos' // Para el sidebar activo
        });

    } catch (error) {
        console.error('Error al mostrar Mis Pedidos (Cuenta):', error);
        req.flash('error_msg', 'Error al cargar tus pedidos.');
        res.redirect('/cuenta');
    }
};

/**
 * Muestra el Detalle de un Pedido específico del cliente.
 * (GET /cuenta/pedidos/:id)
 */
cuentaController.mostrarCuentaDetallePedido = async (req, res) => {
     try {
        const id_pedido = req.params.id;
        const id_usuario = req.session.user.id_usuario;

        const data = await Pedido.getDetalleById(id_pedido);

        if (!data || data.pedido.id_usuario !== id_usuario) {
            req.flash('error_msg', 'Pedido no encontrado o no autorizado.');
            return res.redirect('/cuenta/pedidos');
        }

        res.render('pedido_detalle_cliente', {
            title: `Detalle Pedido #${id_pedido}`,
            // user ya se pasa globalmente
            pedido: data.pedido,
            detalles: data.detalles,
            currentPage: 'pedidos' // Para el sidebar activo
        });

    } catch (error) {
        console.error('Error al mostrar detalle de pedido (Cuenta):', error);
        req.flash('error_msg', 'Error al cargar el detalle del pedido.');
        res.redirect('/cuenta/pedidos');
    }
};


/**
 * Muestra la página de Configuración (unifica perfil y seguridad).
 * (GET /cuenta/configuracion)
 */
cuentaController.mostrarCuentaConfiguracion = async (req, res) => {
    try {
        const id_usuario = req.session.user.id_usuario;
        // Usar getById para tener todos los datos, incluyendo contraseña (aunque no se muestre)
        const perfil = await Usuario.getById(id_usuario);

        if (!perfil) {
            req.flash('error_msg', 'No se pudo cargar tu información.');
            return res.redirect('/cuenta');
        }

        // Obtener errores y datos de formularios anteriores desde flash
        const validationErrors = req.flash('validation_errors') || [];
        const formData = req.flash('form_data')[0] || perfil; // Usa flash si existe, si no, los datos actuales

        res.render('cuenta_configuracion', {
            title: 'Configuración de Cuenta',
            // user ya se pasa globalmente
            perfil: perfil, // Datos actuales (para DNI readonly, etc.)
            errors: validationErrors, // Errores para mostrar
            formData: formData, // Datos para repoblar formularios
            currentPage: 'configuracion' // Para el sidebar activo
        });

    } catch (error) {
        console.error('Error al mostrar Configuración:', error);
        req.flash('error_msg', 'Error al cargar la página de configuración.');
        res.redirect('/cuenta');
    }
};


/**
 * Procesa la actualización del PERFIL desde la página de Configuración.
 * (POST /cuenta/configuracion/perfil)
 */
cuentaController.procesarEditarPerfil = async (req, res) => {
    const id_usuario = req.session.user.id_usuario;
    // Solo tomamos los campos que permitimos editar
    const { nombre, apellido_paterno, apellido_materno, telefono, correo, usuario } = req.body;
    const errors = [];

    // --- Validación (ajustar si es necesario) ---
    const regexLetras = /^[A-Za-z\sñáéíóúÁÉÍÓÚ]+$/;
    if (!nombre || !regexLetras.test(nombre)) errors.push('El nombre solo debe contener letras y espacios.');
    if (!apellido_paterno || !regexLetras.test(apellido_paterno)) errors.push('El apellido paterno solo debe contener letras y espacios.');
    if (!apellido_materno || !regexLetras.test(apellido_materno)) errors.push('El apellido materno solo debe contener letras y espacios.');
    const regexTelefono = /^[0-9+]*$/;
    // Permitir teléfono vacío
    if (telefono && telefono.trim() !== '' && !regexTelefono.test(telefono)) errors.push('El teléfono solo debe contener números y "+".');
    const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!correo || !regexCorreo.test(correo)) errors.push('El formato del correo no es válido.');
    if (!usuario || usuario.length < 3) errors.push('El nombre de usuario debe tener al menos 3 caracteres.');
    // --- Fin Validación ---

    if (errors.length > 0) {
        req.flash('validation_errors', errors);
        req.flash('form_data', req.body); // Guardar datos para repoblar
        return res.redirect('/cuenta/configuracion');
    }

    try {
        await Usuario.updateProfile(id_usuario, {
            nombre, apellido_paterno, apellido_materno, telefono, correo, usuario
        });

        // Actualizar el nombre en la sesión si cambió
        if (req.session.user.nombre !== nombre) {
            req.session.user.nombre = nombre;
        }

        req.flash('success_msg', 'Perfil actualizado exitosamente.');
        res.redirect('/cuenta/configuracion');

    } catch (error) { // Captura errores del modelo (ej: duplicados) o de BD
        console.error('Error al actualizar perfil:', error);
        // Usar validation_errors para mostrar el mensaje de error del modelo
        req.flash('validation_errors', [error.message || 'Error al guardar los cambios.']);
        req.flash('form_data', req.body); // Guardar datos para repoblar
        res.redirect('/cuenta/configuracion');
    }
};

/**
 * Procesa el cambio de CONTRASEÑA desde la página de Configuración.
 * (POST /cuenta/configuracion/password)
 */
cuentaController.procesarCambioPassword = async (req, res) => {
    const id_usuario = req.session.user.id_usuario;
    const { passCurrent, passNew, passConfirm } = req.body;
    const errors = [];

    if (!passCurrent || !passNew || !passConfirm) {
        errors.push('Todos los campos de contraseña son obligatorios.');
    } else if (passNew.length < 6) {
        errors.push('La nueva contraseña debe tener al menos 6 caracteres.');
    } else if (passNew !== passConfirm) {
        errors.push('La nueva contraseña y su confirmación no coinciden.');
    }

    if (errors.length > 0) {
        req.flash('validation_errors', errors);
        // No guardamos las contraseñas en form_data por seguridad
        return res.redirect('/cuenta/configuracion');
    }

    try {
        const usuarioActual = await Usuario.getById(id_usuario); // Necesita traer contraseña
        if (!usuarioActual) {
             req.flash('validation_errors', ['Error: Usuario no encontrado.']);
             return res.redirect('/cuenta/configuracion');
        }

        const isMatch = await bcrypt.compare(passCurrent, usuarioActual.contraseña);
        if (!isMatch) {
            req.flash('validation_errors', ['La contraseña actual es incorrecta.']);
            return res.redirect('/cuenta/configuracion');
        }

        // Si la contraseña actual es correcta, hashear y guardar la nueva
        const salt = await bcrypt.genSalt(10);
        const hashNueva = await bcrypt.hash(passNew, salt);

        // Llamar al método del modelo (que debemos crear)
        const updated = await Usuario.updatePassword(id_usuario, hashNueva);

        if (updated > 0) { // updatePassword debería devolver affectedRows
            req.flash('success_msg', 'Contraseña actualizada correctamente.');
        } else {
            req.flash('validation_errors', ['No se pudo actualizar la contraseña en la base de datos.']);
        }
        res.redirect('/cuenta/configuracion');

    } catch (error) {
        console.error("Error cambiando contraseña:", error);
        req.flash('validation_errors', ['Error interno al cambiar la contraseña.']);
        res.redirect('/cuenta/configuracion');
    }
};


// --- Funciones para Favoritos y Tarjetas (Placeholder) ---

cuentaController.mostrarCuentaMisFavoritos = (req, res) => {
     res.render('cuenta_mis_favoritos', {
        title: 'Mis Favoritos',
        // user ya se pasa globalmente
        currentPage: 'favoritos' // Para el sidebar activo
        // Pasar datos de favoritos si los hubiera
    });
};

cuentaController.mostrarCuentaMisTarjetas = (req, res) => {
     res.render('cuenta_mis_tarjetas', {
        title: 'Mis Tarjetas',
        // user ya se pasa globalmente
        currentPage: 'tarjetas' // Para el sidebar activo
        // Pasar datos de tarjetas si los hubiera
    });
};


module.exports = cuentaController;

