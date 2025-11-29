// src/controllers/favorito.controller.js
const Favorito = require('../models/favorito.model');

const favoritoController = {};

// API para Alternar (Toggle) Favorito
favoritoController.toggleAPI = async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: 'Debes iniciar sesión.' });
    }

    const { id_producto } = req.body;
    const id_usuario = req.session.user.id_usuario;

    try {
        const existe = await Favorito.exists(id_usuario, id_producto);

        if (existe) {
            await Favorito.remove(id_usuario, id_producto);
            res.json({ success: true, isFavorite: false, message: 'Eliminado de favoritos.' });
        } else {
            await Favorito.add(id_usuario, id_producto);
            res.json({ success: true, isFavorite: true, message: 'Añadido a favoritos.' });
        }
    } catch (error) {
        console.error('Error al alternar favorito:', error);
        res.status(500).json({ success: false, message: 'Error del servidor.' });
    }
};

module.exports = favoritoController;