// src/controllers/pedido.controller.js
// (ACTUALIZADO - Recibe datos, crea pedido pendiente, redirige a pago)

const Pedido = require('../models/pedido.model');
const Carrito = require('../models/carrito.model'); // Necesario para limpiar BD
const Usuario = require('../models/usuario.model'); // Necesario para datos en checkout
const { inicializarCarrito } = require('../utils/cart.utils'); // Ya no usamos esto aquí

const pedidoController = {};

/**
 * Muestra la página de Checkout (confirmación de datos).
 * Carga datos del perfil para pre-rellenar.
 * (GET /pedido/checkout)
 */
pedidoController.mostrarCheckout = async (req, res) => { // Convertido a async
    const cart = req.session.cart;

    if (!cart || cart.items.length === 0) {
        req.flash('error_msg', 'Tu carrito está vacío.');
        return res.redirect('/carrito');
    }

    try {
        // Cargar perfil del usuario para pre-rellenar datos (ej. teléfono)
        const perfil = await Usuario.getProfileById(req.session.user.id_usuario);

        res.render('checkout', {
            title: 'Confirmar Datos - TechStore',
            carrito: cart,
            user: req.session.user,
            perfil: perfil, // Pasar perfil a la vista
            error_msg: req.flash('error_msg') // Pasar mensajes flash si los hay
        });
    } catch (error) {
         console.error('Error al cargar datos para checkout:', error);
         req.flash('error_msg', 'Error al cargar la página de confirmación.');
         res.redirect('/carrito');
    }
};

/**
 * Procesa los datos del checkout, CREA el pedido como 'Pendiente',
 * y REDIRIGE a la página de simulación de pago.
 * (POST /pedido/procesar)
 */
pedidoController.procesarPedido = async (req, res) => {
    const sessionCart = req.session.cart;
    const id_usuario = req.session.user.id_usuario;
    const { direccion_envio, tipo_comprobante, telefono_contacto } = req.body; // Recibir nuevos datos

    // Validar datos básicos
    if (!sessionCart || sessionCart.items.length === 0) {
        req.flash('error_msg', 'Tu carrito está vacío.');
        return res.redirect('/carrito');
    }
    if (!direccion_envio || !tipo_comprobante || !telefono_contacto) {
         req.flash('error_msg', 'Por favor, completa la dirección, tipo de comprobante y teléfono.');
         // Volver a renderizar checkout CON los datos ingresados y el error
         // Necesitamos recargar el perfil
         const perfil = await Usuario.getProfileById(id_usuario);
         return res.render('checkout', {
             title: 'Confirmar Datos - TechStore',
             carrito: sessionCart, user: req.session.user, perfil: perfil,
             formData: req.body, // Devolver datos ingresados
             error_msg: req.flash('error_msg') // Mostrar el mensaje flash aquí
         });
    }


    try {
        // Llamamos al modelo para crear el pedido (la transacción PEPS)
        // Pasamos los nuevos datos al modelo
        const id_pedido_creado = await Pedido.create(id_usuario, sessionCart, {
            direccion_envio,
            tipo_comprobante,
            telefono_contacto // Aunque no lo guardemos directo en pedido, podría ser útil
        });

        // ¡ÉXITO PARCIAL! Pedido creado como Pendiente.
        // 1. Limpiamos el carrito de sesión y BD (porque ya se convirtió en pedido)
        const dbCartId = req.session.dbCartId;
        if (dbCartId) {
            try {
                await Carrito.clearCart(dbCartId);
                req.session.dbCartId = null;
            } catch (clearError) {
                console.error("Error al limpiar carrito de BD post-pedido:", clearError);
            }
        }
        req.session.cart = null;

        // 2. Redirigimos a la PÁGINA DE PAGO, pasando el ID del pedido
        res.redirect(`/pago/${id_pedido_creado}`);

    } catch (error) { // Error de la transacción (ej: sin stock)
        console.error('Error al procesar el pedido (transacción):', error);
        req.flash('error_msg', `Error al crear el pedido: ${error.message}`);
        res.redirect('/checkout'); // Volver a checkout
    }
};


module.exports = pedidoController;