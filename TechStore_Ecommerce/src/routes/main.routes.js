// src/routes/main.routes.js
// (ACTUALIZADO - Busca imagen de producto por categoría)

const express = require('express');
const router = express.Router();
const Producto = require('../models/producto.model');
const pool = require('../models/db'); // Importa el pool

// Ruta principal (Homepage)
router.get('/', async (req, res) => {
    try {
        // --- Productos Destacados (Sin cambios) ---
        const sqlDestacados = `
            SELECT
                p.id_producto, p.nombre_producto, p.descripcion_producto,
                p.precio, p.imagen, c.nombre_categoria,
                (SELECT SUM(lp.cantidad_actual)
                 FROM lote_producto lp
                 WHERE lp.id_producto = p.id_producto AND lp.cantidad_actual > 0) AS stock
            FROM producto p
            LEFT JOIN categoria c ON p.id_categoria = c.id_categoria
            HAVING stock > 0
            ORDER BY p.fecha_registro DESC
            LIMIT 4
        `;
        const [productosDestacados] = await pool.query(sqlDestacados);

        // --- Categorías Destacadas con Imagen ---
        // 1. Obtenemos las categorías (máximo 4)
        const categorias = await Producto.getAllCategories();
        let categoriasDestacadas = categorias.slice(0, 4);

        // 2. Para cada categoría, buscamos la imagen del primer producto asociado
        // Usamos Promise.all para hacer las búsquedas en paralelo
        categoriasDestacadas = await Promise.all(categoriasDestacadas.map(async (cat) => {
            const sqlImagenProducto = `
                SELECT imagen 
                FROM producto 
                WHERE id_categoria = ? AND imagen IS NOT NULL AND imagen != ''
                LIMIT 1 
            `;
            const [imagenResult] = await pool.query(sqlImagenProducto, [cat.id_categoria]);
            
            // Añadimos la URL de la imagen (o null) al objeto categoría
            return {
                ...cat, // Copiamos las propiedades existentes de la categoría
                imagen_producto: imagenResult.length > 0 ? imagenResult[0].imagen : null 
            };
        }));

        // --- Renderizar Vista ---
        res.render('index', {
            title: 'Inicio - TechStore',
            productosDestacados: productosDestacados,
            categorias: categoriasDestacadas, // Pasamos las categorías CON la imagen
            error: req.query.error || null
        });

    } catch (error) {
        console.error("Error al cargar la página de inicio:", error);
        res.render('index', {
            title: 'Inicio - TechStore',
            productosDestacados: [],
            categorias: [],
            error: "No se pudieron cargar los datos de la página principal."
        });
    }
});

module.exports = router;