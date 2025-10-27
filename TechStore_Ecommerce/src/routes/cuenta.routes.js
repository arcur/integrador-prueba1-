// src/routes/cuenta.routes.js
// ACTUALIZADO para usar layout en /layouts y vistas en /TechStore_Intranet_Usuario

const express = require('express');
const router = express.Router();
const cuentaController = require('../controllers/cuenta.controller.js');
const { isAuth } = require('../middlewares/auth.middleware.js');

// Proteger TODAS las rutas de esta sección con isAuth
router.use(isAuth);

// Middleware para establecer el layout y pasar datos globales
router.use((req, res, next) => {
    // CORRECCIÓN: Apuntar al layout movido a /layouts
    res.locals.layout = 'layouts/cuenta_layout';
    res.locals.user = req.session.user;

    // Determinar currentPage (sin cambios)
    const path = req.path;
    if (path === '/') res.locals.currentPage = 'dashboard';
    else if (path.startsWith('/pedidos')) res.locals.currentPage = 'pedidos';
    else if (path.startsWith('/favoritos')) res.locals.currentPage = 'favoritos';
    else if (path.startsWith('/tarjetas')) res.locals.currentPage = 'tarjetas';
    else if (path.startsWith('/configuracion')) res.locals.currentPage = 'configuracion';
    else res.locals.currentPage = 'dashboard';

    next();
});

// Rutas (sin cambios en las llamadas al controlador)
router.get('/', cuentaController.mostrarCuentaDashboard);
router.get('/pedidos', cuentaController.mostrarCuentaMisPedidos);
router.get('/pedidos/:id', cuentaController.mostrarCuentaDetallePedido);
router.get('/configuracion', cuentaController.mostrarCuentaConfiguracion);
router.post('/configuracion/perfil', cuentaController.procesarEditarPerfil);
router.post('/configuracion/password', cuentaController.procesarCambioPassword);
router.get('/favoritos', cuentaController.mostrarCuentaMisFavoritos);
router.get('/tarjetas', cuentaController.mostrarCuentaMisTarjetas);

module.exports = router;

