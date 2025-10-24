// src/models/producto.model.js
// (ACTUALIZADO con función de filtrado/ordenación)

const pool = require('./db');

const Producto = {};

// Subconsulta para calcular el stock total
const STOCK_TOTAL_QUERY = `
    (SELECT SUM(lp.cantidad_actual)
     FROM lote_producto lp
     WHERE lp.id_producto = p.id_producto AND lp.cantidad_actual > 0)
`;

/**
 * ¡NUEVA FUNCIÓN VERSÁTIL!
 * Obtiene productos filtrados, buscados y ordenados para el catálogo.
 *
 * @param {object} options - Opciones de filtrado y ordenación.
 * @param {number} [options.categoriaId] - ID de la categoría a filtrar.
 * @param {number} [options.precioMin] - Precio mínimo.
 * @param {number} [options.precioMax] - Precio máximo.
 * @param {string} [options.searchTerm] - Término de búsqueda (para nombre/descripción).
 * @param {string} [options.sortBy] - Criterio de ordenación ('precio_asc', 'precio_desc', 'nombre_asc').
 */
Producto.getFilteredSortedProducts = async (options = {}) => {
    let sql = `
        SELECT
            p.id_producto,
            p.nombre_producto,
            p.descripcion_producto,
            p.precio,
            p.imagen,
            c.nombre_categoria,
            ${STOCK_TOTAL_QUERY} AS stock
        FROM producto p
        LEFT JOIN categoria c ON p.id_categoria = c.id_categoria
    `;

    const whereClauses = [];
    const params = [];

    // --- Construcción de Cláusulas WHERE ---
    // Siempre filtramos por stock > 0 implícitamente con HAVING al final

    // 1. Filtro por Categoría
    if (options.categoriaId) {
        whereClauses.push('p.id_categoria = ?');
        params.push(options.categoriaId);
    }

    // 2. Filtro por Rango de Precio
    if (options.precioMin) {
        whereClauses.push('p.precio >= ?');
        params.push(options.precioMin);
    }
    if (options.precioMax) {
        whereClauses.push('p.precio <= ?');
        params.push(options.precioMax);
    }

    // 3. Filtro por Término de Búsqueda (en nombre o descripción)
    if (options.searchTerm) {
        // Usamos LIKE con '%' para buscar en cualquier parte del texto
        whereClauses.push('(p.nombre_producto LIKE ? OR p.descripcion_producto LIKE ?)');
        params.push(`%${options.searchTerm}%`);
        params.push(`%${options.searchTerm}%`);
    }

    // Unir cláusulas WHERE si existen
    if (whereClauses.length > 0) {
        sql += ' WHERE ' + whereClauses.join(' AND ');
    }

    // --- Cláusula HAVING para Stock ---
    // Se aplica después del WHERE y antes del ORDER BY
    sql += ' HAVING stock > 0';

    // --- Construcción de Cláusula ORDER BY ---
    switch (options.sortBy) {
        case 'precio_asc':
            sql += ' ORDER BY p.precio ASC';
            break;
        case 'precio_desc':
            sql += ' ORDER BY p.precio DESC';
            break;
        case 'nombre_asc':
            sql += ' ORDER BY p.nombre_producto ASC';
            break;
        default:
            sql += ' ORDER BY p.nombre_producto ASC'; // Orden por defecto
    }

    // Ejecutar la consulta SQL construida
    const [rows] = await pool.query(sql, params);
    return rows;
};


// --- Funciones Anteriores (Asegúrate de que estén) ---

/** Obtener todas las categorías (para filtros) */
Producto.getAllCategories = async () => {
    const sql = 'SELECT * FROM categoria ORDER BY nombre_categoria ASC';
    const [rows] = await pool.query(sql);
    return rows;
};

/** Obtener un producto por ID (para añadir al carrito) */
Producto.getById = async (id_producto) => {
    const sql = `
        SELECT
            p.*,
            IFNULL(${STOCK_TOTAL_QUERY}, 0) AS stock
        FROM producto p
        WHERE p.id_producto = ?
    `;
    const [rows] = await pool.query(sql, [id_producto]);
    return rows[0];
};

// --- (Funciones de Admin: getAllForAdmin, create, update, delete, getAllProviders) ---
// (Estas no cambian y deben estar aquí también)
Producto.getAllForAdmin = async () => { /* ... código anterior ... */ };
Producto.create = async (newProducto) => { /* ... código anterior ... */ };
Producto.update = async (id_producto, productData) => { /* ... código anterior ... */ };
Producto.delete = async (id_producto) => { /* ... código anterior ... */ };
Producto.getAllProviders = async () => { /* ... código anterior ... */ };


// src/models/producto.model.js
// ... (resto de funciones: getFilteredSortedProducts, getAllCategories, getById, etc.) ...

/**
 * ¡NUEVO! Obtiene productos relacionados (misma categoría, excluyendo el actual).
 * @param {number} id_categoria - ID de la categoría a buscar.
 * @param {number} id_producto_actual - ID del producto que se está viendo (para excluirlo).
 * @param {number} [limit=4] - Cuántos relacionados mostrar.
 */
Producto.getRelatedProducts = async (id_categoria, id_producto_actual, limit = 4) => {
    // Asegurarse de que id_categoria no sea nulo o indefinido antes de la consulta
    if (!id_categoria) {
        return []; // Devuelve vacío si no hay categoría
    }

    const sql = `
        SELECT
            p.id_producto,
            p.nombre_producto,
            p.precio,
            p.imagen,
            (SELECT SUM(lp.cantidad_actual)
             FROM lote_producto lp
             WHERE lp.id_producto = p.id_producto AND lp.cantidad_actual > 0) AS stock
        FROM producto p
        WHERE p.id_categoria = ?        -- Misma categoría
          AND p.id_producto != ?      -- Excluir el producto actual
        HAVING stock > 0               -- Solo con stock
        ORDER BY RAND()                -- Orden aleatorio para variedad
        LIMIT ?                        -- Limitar cantidad
    `;
    const [rows] = await pool.query(sql, [id_categoria, id_producto_actual, limit]);
    return rows;
};

module.exports = Producto;