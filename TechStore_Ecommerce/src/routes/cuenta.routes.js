// src/routes/cuenta.routes.js

const express = require('express');
const router = express.Router();
const cuentaController = require('../controllers/cuenta.controller.js');
const { isAuth } = require('../middlewares/auth.middleware.js'); // Usamos el middleware

// Proteger TODAS las rutas de esta sección con isAuth
router.use(isAuth);

// Ruta principal de Mi Cuenta
router.get('/mi-cuenta', cuentaController.mostrarMiCuenta);

// Ruta para ver Mis Pedidos
router.get('/mis-pedidos', cuentaController.mostrarMisPedidos);

// ¡NUEVA RUTA! Para ver el detalle de un pedido específico del cliente
router.get('/mis-pedidos/:id', cuentaController.mostrarDetallePedidoCliente);

// ¡NUEVAS RUTAS!
router.get('/editar-perfil', cuentaController.mostrarFormularioEditarPerfil);
router.post('/editar-perfil', cuentaController.procesarEditarPerfil);

module.exports = router;