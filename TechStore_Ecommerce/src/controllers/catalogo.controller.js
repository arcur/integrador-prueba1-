// src/controllers/catalogo.controller.js
// (ACTUALIZADO para usar filtros y ordenación desde query params)

const Producto = require('../models/producto.model');

const catalogoController = {};

/**
 * Controlador ÚNICO para mostrar el catálogo (filtrado, buscado, ordenado).
 * Lee los parámetros desde req.query.
 */
catalogoController.mostrarCatalogo = async (req, res) => {
    try {
        // 1. Extraer parámetros de la URL (req.query)
        const { categoria, precioMin, precioMax, q, ordenarPor } = req.query;

        // 2. Preparar objeto de opciones para el modelo
        const options = {
            categoriaId: categoria ? parseInt(categoria, 10) : null,
            precioMin: precioMin ? parseFloat(precioMin) : null,
            precioMax: precioMax ? parseFloat(precioMax) : null,
            searchTerm: q || null, // 'q' es común para search query
            sortBy: ordenarPor || 'nombre_asc' // Orden por defecto
        };

        // 3. Obtener productos filtrados/ordenados y todas las categorías
        const [productos, categorias] = await Promise.all([
            Producto.getFilteredSortedProducts(options), // Usamos la nueva función versátil
            Producto.getAllCategories()
        ]);

        // 4. Determinar título y categoría activa (si aplica)
        let titulo = 'Nuestro Catálogo - TechStore';
        let categoriaActivaNombre = 'Todas';
        if (options.categoriaId) {
            const catActiva = categorias.find(c => c.id_categoria === options.categoriaId);
            if (catActiva) {
                titulo = `${catActiva.nombre_categoria} - Catálogo`;
                categoriaActivaNombre = catActiva.nombre_categoria;
            }
        }
        if (options.searchTerm) {
             titulo = `Resultados para "${options.searchTerm}" - Catálogo`
        }


        // 5. Renderizar la vista pasando todos los datos y los filtros actuales
        res.render('catalogo', {
            title: titulo,
            productos: productos,
            categorias: categorias,
            filtrosActuales: { // Para rellenar el formulario de filtros
                categoria: options.categoriaId,
                precioMin: options.precioMin,
                precioMax: options.precioMax,
                q: options.searchTerm,
                ordenarPor: options.sortBy
            },
            categoriaActivaNombre: categoriaActivaNombre, // Nombre para mostrar
            error: req.query.error || null,
            success: req.query.success || null
        });

    } catch (error) {
        console.error('Error al mostrar el catálogo:', error);
        res.status(500).send('Error interno del servidor al cargar catálogo.');
    }
};

// Ya no necesitamos mostrarCatalogoPorCategoria

module.exports = catalogoController;