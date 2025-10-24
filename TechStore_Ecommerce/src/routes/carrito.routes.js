// src/routes/carrito.routes.js
// (ACTUALIZADO - Todas las acciones requieren login)

const express = require('express');
const router = express.Router();
const carritoController = require('../controllers/carrito.controller.js');
const { isAuth } = require('../middlewares/auth.middleware.js'); // Middleware de autenticación

// Mostrar el carrito (También requiere login para ver un carrito persistente)
router.get('/', isAuth, carritoController.mostrarCarrito);

// Añadir al carrito API (protegida)
router.post('/api/agregar/:id', isAuth, carritoController.agregarAlCarritoAPI);

// Eliminar un item (protegida)
router.get('/eliminar/:id', isAuth, carritoController.eliminarDelCarrito);

// Actualizar cantidad (protegida)
router.post('/actualizar', isAuth, carritoController.actualizarCantidad);

// Eliminamos o comentamos la ruta GET /agregar/:id si ya no se usa
// router.get('/agregar/:id', isAuth, carritoController.agregarAlCarrito);

module.exports = router;