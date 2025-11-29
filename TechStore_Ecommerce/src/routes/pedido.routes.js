// src/routes/pedido.routes.js

const express = require('express');
const router = express.Router();
const pedidoController = require('../controllers/pedido.controller.js');
const { isAuth } = require('../middlewares/auth.middleware.js');

// Todas las rutas de pedido DEBEN estar protegidas.
// El usuario debe estar logueado para llegar aquí.

// Mostrar la página de confirmación (Checkout)
// Usamos el middleware 'isAuth' ANTES de llamar al controlador
router.get('/checkout', isAuth, pedidoController.mostrarCheckout);

// Procesar el pedido (la acción de 'Confirmar')
router.post('/procesar', isAuth, pedidoController.procesarPedido);

router.get('/api/ruc/:numero', isAuth, pedidoController.consultarRUC);

module.exports = router;