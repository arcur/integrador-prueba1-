// src/controllers/pedido.controller.js

const Pedido = require('../models/pedido.model');
const { inicializarCarrito } = require('../utils/cart.utils');
const Carrito = require('../models/carrito.model');
const pedidoController = {};

/**
 * Muestra la página de Checkout (confirmación)
 * (GET /pedido/checkout)
 */
pedidoController.mostrarCheckout = (req, res) => {
    // Reutilizamos la función del carrito. Si no existe, crea uno vacío.
    const cart = req.session.cart;

    // Si el carrito está vacío, no hay nada que procesar
    if (!cart || cart.items.length === 0) {
        return res.redirect('/carrito?error=Tu carrito está vacío.');
    }

    res.render('checkout', {
        title: 'Confirmar Pedido - TechStore',
        carrito: cart,
        // Pasamos los datos del usuario para la dirección (aún no la usamos, pero es útil)
        user: req.session.user 
    });
};

/**
 * Procesa el pedido (guarda en la BD)
 * (POST /pedido/procesar)
 */
pedidoController.procesarPedido = async (req, res) => {
    const cart = req.session.cart;
    const id_usuario = req.session.user.id_usuario;

    // Doble verificación: carrito vacío
    if (!cart || cart.items.length === 0) {
        return res.redirect('/carrito?error=Tu carrito está vacío.');
    }

    try {
        // Llamamos al modelo para crear el pedido (la transacción)
        const id_pedido_creado = await Pedido.create(id_usuario, cart);

        // ¡ÉXITO!
        // 1. Limpiamos el carrito de la sesión
        req.session.cart = null; 
        
        // 2. Redirigimos a una página de éxito
        res.render('pedido_exitoso', {
            title: 'Pedido Confirmado',
            id_pedido: id_pedido_creado
        });

    } catch (error) {
        // Si la transacción falló (ej: sin stock)
        console.error('Error al procesar el pedido:', error);
        // Devolvemos al usuario al carrito con el mensaje de error
        res.redirect(`/carrito?error=${encodeURIComponent(error.message)}`);
    }
};

module.exports = pedidoController;