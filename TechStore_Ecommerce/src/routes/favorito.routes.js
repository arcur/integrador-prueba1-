// src/routes/favorito.routes.js
const express = require('express');
const router = express.Router();
const favoritoController = require('../controllers/favorito.controller');

// Ruta API para el botón
router.post('/api/toggle', favoritoController.toggleAPI);

module.exports = router;