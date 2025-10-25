// src/models/producto.model.js
// (VERSIÓN FINAL COMPLETA - Corregida y Unificada)

const pool = require('./db');

const Producto = {};

// Subconsulta reutilizable para calcular el stock total
const STOCK_TOTAL_QUERY = `
    (SELECT SUM(lp.cantidad_actual)
     FROM lote_producto lp
     WHERE lp.id_producto = p.id_producto AND lp.cantidad_actual > 0)
`;

/**
 * Función VERSÁTIL para el CATÁLOGO: Obtiene productos filtrados, buscados y ordenados.
 */
Producto.getFilteredSortedProducts = async (options = {}) => {
    let sql = `
        SELECT
            p.id_producto, p.nombre_producto, p.descripcion_producto,
            p.precio, p.imagen, c.nombre_categoria,
            ${STOCK_TOTAL_QUERY} AS stock
        FROM producto p
        LEFT JOIN categoria c ON p.id_categoria = c.id_categoria
    `;
    
    const whereClauses = [];
    const params = [];

    // Filtros
    if (options.categoriaId) {
        whereClauses.push('p.id_categoria = ?');
        params.push(options.categoriaId);
    }
    if (options.precioMin) {
        whereClauses.push('p.precio >= ?');
        params.push(options.precioMin);
    }
    if (options.precioMax) {
        whereClauses.push('p.precio <= ?');
        params.push(options.precioMax);
    }
    if (options.searchTerm) {
        whereClauses.push('(p.nombre_producto LIKE ? OR p.descripcion_producto LIKE ?)');
        params.push(`%${options.searchTerm}%`);
        params.push(`%${options.searchTerm}%`);
    }

    if (whereClauses.length > 0) {
        sql += ' WHERE ' + whereClauses.join(' AND ');
    }
    sql += ' HAVING stock > 0'; // Siempre requiere stock

    // Ordenación
    switch (options.sortBy) {
        case 'precio_asc': sql += ' ORDER BY p.precio ASC'; break;
        case 'precio_desc': sql += ' ORDER BY p.precio DESC'; break;
        case 'nombre_asc':
        default: sql += ' ORDER BY p.nombre_producto ASC'; break;
    }

    const [rows] = await pool.query(sql, params);
    return rows; // <-- Retorna rows
};

/**
 * Obtener todas las categorías (para filtros).
 */
Producto.getAllCategories = async () => {
    const sql = 'SELECT * FROM categoria ORDER BY nombre_categoria ASC';
    const [rows] = await pool.query(sql);
    return rows; // <-- Retorna rows
};

/**
 * Obtener un producto por su ID (para detalle, carrito, admin editar).
 */
Producto.getById = async (id_producto) => {
    const sql = `
        SELECT
            p.*,
            IFNULL(${STOCK_TOTAL_QUERY}, 0) AS stock
        FROM producto p
        WHERE p.id_producto = ?
    `;
    const [rows] = await pool.query(sql, [id_producto]);
    return rows[0]; // Retorna el primer objeto o undefined
};

/**
 * Obtiene productos relacionados (misma categoría, para página de detalle).
 */
Producto.getRelatedProducts = async (id_categoria, id_producto_actual, limit = 4) => {
    if (!id_categoria) return [];
    const sql = `
        SELECT
            p.id_producto, p.nombre_producto, p.precio, p.imagen,
            ${STOCK_TOTAL_QUERY} AS stock
        FROM producto p
        WHERE p.id_categoria = ? AND p.id_producto != ?
        HAVING stock > 0
        ORDER BY RAND()
        LIMIT ?
    `;
    const [rows] = await pool.query(sql, [id_categoria, id_producto_actual, limit]);
    return rows; // <-- Retorna rows
};


// ============================================
// === FUNCIONES ESPECÍFICAS PARA ADMIN PANEL ===
// ============================================

/**
 * Obtener TODOS los productos para la tabla del Admin (incluye sin stock).
 * (Esta era la función que faltaba o estaba incorrecta)
 */
Producto.getAllForAdmin = async () => {
    const sql = `
        SELECT
            p.id_producto,
            p.nombre_producto,
            p.precio,
            c.nombre_categoria,
            IFNULL(${STOCK_TOTAL_QUERY}, 0) AS stock
        FROM producto p
        LEFT JOIN categoria c ON p.id_categoria = c.id_categoria
        ORDER BY p.nombre_producto ASC
    `;
    const [rows] = await pool.query(sql);
    return rows; // <-- Retorna rows
};

/**
 * Crear un nuevo producto (Admin).
 */
Producto.create = async (newProducto) => {
    const sql = `
        INSERT INTO producto (
            id_categoria, nombre_producto,
            descripcion_producto, precio, imagen
        ) VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(sql, [
        newProducto.id_categoria || null, newProducto.nombre_producto,
        newProducto.descripcion_producto, newProducto.precio, newProducto.imagen
    ]);
    return result.insertId;
};

/**
 * Actualizar un producto existente (Admin).
 */
Producto.update = async (id_producto, productData) => {
    const sql = `
        UPDATE producto SET
            id_categoria = ?, nombre_producto = ?, descripcion_producto = ?,
            precio = ?, imagen = ?
        WHERE id_producto = ?
    `;
    const [result] = await pool.query(sql, [
        productData.id_categoria || null, productData.nombre_producto,
        productData.descripcion_producto, productData.precio, productData.imagen,
        id_producto
    ]);
    return result.affectedRows;
};

/**
 * Eliminar un producto (Admin).
 */
Producto.delete = async (id_producto) => {
    try {
        const sql = 'DELETE FROM producto WHERE id_producto = ?';
        const [result] = await pool.query(sql, [id_producto]);
        return result.affectedRows;
    } catch (error) {
        if (error.code === 'ER_ROW_IS_REFERENCED_2') { // Error si está en detalle_pedido
            throw new Error('No se puede eliminar el producto porque ya está asociado a pedidos.');
        }
        console.error("Error deleting product:", error); // Loggear otros errores
        throw error; // Re-lanzar para que el controlador lo maneje
    }
};

/**
 * Obtener todos los proveedores (para formularios de Admin).
 */
Producto.getAllProviders = async () => {
    const sql = 'SELECT id_proveedor, nombre_proveedor FROM proveedor ORDER BY nombre_proveedor ASC';
    const [rows] = await pool.query(sql);
    return rows; // <-- Retorna rows
};


module.exports = Producto;