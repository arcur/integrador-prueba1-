// src/controllers/intranet.controller.js

// 1. Importamos los Modelos que SÍ tenemos
const Pedido = require('../models/pedido.model');
const Usuario = require('../models/usuario.model');
// Faltan los modelos de Favoritos y Tarjetas, los dejaremos pendientes

const intranetController = {};

// Esta función es la que se encarga de renderizar la página
// y pasarle los datos dinámicos (como 'user')
const renderIntranetView = async (req, res, viewName, title, pageKey, data = {}) => {
    try {
        const id_usuario = req.session.user.id_usuario;

        const datosUsuario = await Usuario.getById(id_usuario); 

        res.render(viewName, {
            title: `${title} - Mi Cuenta`,
            user: req.session.user, 
            datosUsuario: datosUsuario, 
            currentPage: pageKey, // <-- ¡AQUÍ ESTÁ LA MAGIA!
            ...data 
        });
    } catch (error) {
        console.error(`Error al renderizar la vista ${viewName}:`, error);
        req.flash('error_msg', 'Error al cargar la página.');
        res.redirect('/');
    }
};

// (GET /intranet/dashboard)
intranetController.mostrarDashboard = async (req, res) => {
    // TODO: Buscar datos para el dashboard (ej: último pedido, total gastado)
    // const ultimoPedido = await Pedido.findLastByUsuario(req.session.user.id_usuario);
    
    renderIntranetView(req, res, 'intranet_dashboard', 'Dashboard', 'dashboard', {
        // ultimoPedido: ultimoPedido 
    });
};

// (GET /intranet/mis-pedidos)
intranetController.mostrarMisPedidos = async (req, res) => {
    // TODO: Necesitamos crear la función 'findByUsuario' en pedido.model.js
    // Por ahora, enviamos un array vacío.
    // const misPedidos = await Pedido.findByUsuario(req.session.user.id_usuario); 
    
    renderIntranetView(req, res, 'intranet_mis_pedidos', 'Mis Pedidos', 'pedidos', {
        pedidos: [] // Reemplazaremos esto en el Paso 5
    });
};

// (GET /intranet/configuracion)
intranetController.mostrarConfiguracion = async (req, res) => {
    // Los datos del usuario ya se cargan en 'renderIntranetView'
    // por lo que no necesitamos buscar nada extra aquí.
    renderIntranetView(req, res, 'intranet_configuracion', 'Configuración', 'configuracion');
};

// (GET /intranet/mis-favoritos)
intranetController.mostrarMisFavoritos = async (req, res) => {
    // TODO: Necesitamos crear un modelo y función para Favoritos
    // const misFavoritos = await Favorito.findByUsuario(req.session.user.id_usuario);
    
    renderIntranetView(req, res, 'intranet_mis_favoritos', 'Mis Favoritos', 'favoritos', {
        favoritos: [] 
    });
};

// (GET /intranet/mis-tarjetas)
intranetController.mostrarMisTarjetas = async (req, res) => {
    // TODO: Necesitamos crear un modelo y función para Tarjetas
    // const misTarjetas = await Tarjeta.findByUsuario(req.session.user.id_usuario);
    
    renderIntranetView(req, res, 'intranet_mis_tarjetas', 'Mis Tarjetas', 'tarjetas', {
        tarjetas: [] 
    });
};

module.exports = intranetController;