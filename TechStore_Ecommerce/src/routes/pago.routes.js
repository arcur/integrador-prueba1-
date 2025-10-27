// src/routes/pago.routes.js

const express = require('express');
const router = express.Router();
const pagoController = require('../controllers/pago.controller.js');
const { isAuth } = require('../middlewares/auth.middleware.js');

// Proteger todas las rutas de pago
router.use(isAuth);

// Mostrar página de pago para un pedido
router.get('/pago/:id', pagoController.mostrarPaginaPago);

// Procesar el pago simulado para un pedido
router.post('/pago/:id/procesar', pagoController.procesarPagoSimulado);

module.exports = router;