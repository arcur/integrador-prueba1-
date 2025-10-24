// src/routes/producto.routes.js

const express = require('express');
const router = express.Router();
const productoController = require('../controllers/producto.controller.js');

// Ruta para mostrar el detalle de un producto por su ID
// :id será capturado y estará disponible en req.params.id
router.get('/:id', productoController.mostrarDetalle);

module.exports = router;