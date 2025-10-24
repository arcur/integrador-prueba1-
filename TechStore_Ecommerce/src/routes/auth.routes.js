// src/routes/auth.routes.js

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller.js');

// Ruta para mostrar el formulario de registro
router.get('/registro', authController.mostrarRegistro);

// Ruta para procesar el formulario de registro
router.post('/registro', authController.procesarRegistro);

// Ruta para mostrar el formulario de login
router.get('/login', authController.mostrarLogin);

// Ruta para procesar el formulario de login
router.post('/login', authController.procesarLogin);

// Ruta para cerrar sesión
router.get('/logout', authController.cerrarSesion);

module.exports = router;