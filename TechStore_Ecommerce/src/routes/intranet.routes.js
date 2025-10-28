// src/routes/intranet.routes.js
const express = require('express');
const router = express.Router();

// 1. IMPORTAMOS EL MIDDLEWARE DE AUTENTICACIÓN
// Este 'isAuth' es el que creamos para proteger rutas.
const { isAuth } = require('../middlewares/auth.middleware.js');

// 2. IMPORTAMOS EL CONTROLADOR (que crearemos en el Paso 4)
// No te preocupes si da error por ahora, aún no lo hemos creado.
const intranetController = require('../controllers/intranet.controller.js');

// 3. ¡IMPORTANTE! APLICAMOS EL MIDDLEWARE 'isAuth' A TODO EL ROUTER
// Esto significa que CUALQUIER ruta definida en este archivo
// (ej: /dashboard, /mis-pedidos) requerirá que el usuario haya iniciado sesión.
// Si no lo ha hecho, 'isAuth' lo redirigirá al /login.
router.use(isAuth); 

// 4. DEFINIMOS LAS RUTAS DE NUESTRA INTRANET
// El controlador 'intranetController' tendrá las funciones que buscan
// los datos en la BD y renderizan el EJS.

// Ruta para (GET /intranet/dashboard) -> Muestra intranet_dashboard.ejs
router.get('/dashboard', intranetController.mostrarDashboard);

// Ruta para (GET /intranet/mis-pedidos) -> Muestra intranet_mis_pedidos.ejs
router.get('/mis_pedidos', intranetController.mostrarMisPedidos);

// Ruta para (GET /intranet/configuracion) -> Muestra intranet_configuracion.ejs
router.get('/configuracion', intranetController.mostrarConfiguracion);

// Ruta para (GET /intranet/mis-favoritos) -> Muestra intranet_mis_favoritos.ejs
router.get('/mis_favoritos', intranetController.mostrarMisFavoritos);

// Ruta para (GET /intranet/mis-tarjetas) -> Muestra intranet_mis_tarjetas.ejs
router.get('/mis_tarjetas', intranetController.mostrarMisTarjetas);

// 5. EXPORTAMOS EL ROUTER
module.exports = router;