// src/controllers/intranet.controller.js

// 1. Importamos los Modelos que SÍ tenemos
const Pedido = require('../models/pedido.model');
const Usuario = require('../models/usuario.model');
const Favorito = require('../models/favorito.model');
const Tarjeta = require('../models/tarjeta.model');


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
    // ¡Usamos la nueva función!
    const misPedidos = await Pedido.findByUsuarioId(req.session.user.id_usuario); 

    renderIntranetView(req, res, 'intranet_mis_pedidos', 'Mis Pedidos', 'pedidos', {
        pedidos: misPedidos // <-- ¡Ahora pasamos los datos reales!
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
    // ¡Usamos la nueva función!
    const misFavoritos = await Favorito.findByUsuarioId(req.session.user.id_usuario);

    renderIntranetView(req, res, 'intranet_mis_favoritos', 'Mis Favoritos', 'favoritos', {
        favoritos: misFavoritos // <-- ¡Pasamos los datos reales!
    });
};

// (GET /intranet/mis-tarjetas)
intranetController.mostrarMisTarjetas = async (req, res) => {
    // ¡Usamos la nueva función!
    const misTarjetas = await Tarjeta.findByUsuarioId(req.session.user.id_usuario);

    renderIntranetView(req, res, 'intranet_mis_tarjetas', 'Mis Tarjetas', 'tarjetas', {
        tarjetas: misTarjetas // <-- ¡Pasamos los datos reales!
    });
};

module.exports = intranetController;