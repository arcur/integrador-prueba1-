// src/controllers/producto.controller.js

const Producto = require('../models/producto.model');

const productoController = {};

/**
 * Muestra la página de detalle de un producto específico.
 * (GET /producto/:id)
 */
productoController.mostrarDetalle = async (req, res) => {
    try {
        const productId = req.params.id;
        const producto = await Producto.getById(productId); // Usamos la función que ya teníamos

        if (!producto) {
            // Si no se encuentra el producto, redirigir al catálogo con error
            return res.redirect('/catalogo?error=Producto no encontrado.');
        }

        // Obtener productos relacionados (si la categoría existe)
        const relacionados = await Producto.getRelatedProducts(producto.id_categoria, productId);

        res.render('producto_detalle', {
            title: `${producto.nombre_producto} - TechStore`,
            producto: producto,
            relacionados: relacionados,
            error: req.query.error || null, // Para mensajes (ej: error al añadir al carrito)
            success: req.query.success || null
        });

    } catch (error) {
        console.error('Error al mostrar detalle del producto:', error);
        res.status(500).send('Error interno del servidor al cargar el producto.');
    }
};

module.exports = productoController;