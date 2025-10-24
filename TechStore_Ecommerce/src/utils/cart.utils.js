// src/utils/cart.utils.js

// Revisa si el carrito existe en la sesión; si no, lo crea.
function inicializarCarrito(req) {
    if (!req.session.cart) {
        req.session.cart = {
            items: [],
            total: 0
        };
    }
    return req.session.cart;
}

// Recalcula el total del carrito
function recalcularTotal(cart) {
    cart.total = 0;
    cart.items.forEach(item => {
        cart.total += item.precio * item.cantidad;
    });
}

module.exports = { inicializarCarrito, recalcularTotal };