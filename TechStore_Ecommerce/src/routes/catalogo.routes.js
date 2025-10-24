// src/routes/catalogo.routes.js
// (SIMPLIFICADO - Solo una ruta que usa query params)

const express = require('express');
const router = express.Router();
const catalogoController = require('../controllers/catalogo.controller.js');

// Todas las solicitudes GET a /catalogo (con o sin query params)
// serán manejadas por la misma función del controlador.
router.get('/', catalogoController.mostrarCatalogo);

module.exports = router;