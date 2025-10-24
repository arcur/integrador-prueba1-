// src/models/carrito.model.js

const pool = require('./db');

const Carrito = {};

/**
 * Encuentra o crea un carrito activo para un usuario.
 * Devuelve el ID del carrito.
 * @param {number} id_usuario
 * @returns {Promise<number>} ID del carrito_compra
 */
Carrito.findOrCreateActiveCart = async (id_usuario) => {
    let connection;
    try {
        connection = await pool.getConnection();
        // Buscar carrito activo (podríamos añadir un estado 'Activo'/'Completado' si quisiéramos)
        let [rows] = await connection.query(
            'SELECT id_carrito FROM carrito_compra WHERE id_usuario = ? LIMIT 1',
            [id_usuario]
        );

        if (rows.length > 0) {
            return rows[0].id_carrito; // Devuelve ID existente
        } else {
            // Crear nuevo carrito si no existe
            const [result] = await connection.query(
                'INSERT INTO carrito_compra (id_usuario) VALUES (?)',
                [id_usuario]
            );
            return result.insertId; // Devuelve ID del nuevo carrito
        }
    } finally {
        if (connection) connection.release();
    }
};

/**
 * Obtiene todos los items de un carrito específico.
 * @param {number} id_carrito
 * @returns {Promise<Array>} Array de items { id_producto, cantidad }
 */
Carrito.getItems = async (id_carrito) => {
    const [rows] = await pool.query(
        'SELECT id_producto, cantidad FROM detalle_carrito WHERE id_carrito = ?',
        [id_carrito]
    );
    return rows;
};

/**
 * Añade o actualiza un item en el detalle del carrito.
 * @param {number} id_carrito
 * @param {number} id_producto
 * @param {number} cantidad
 * @param {number} stock_disponible (Para validación)
 */
Carrito.upsertItem = async (id_carrito, id_producto, cantidad, stock_disponible) => {
    // Validar cantidad contra stock
    if (cantidad > stock_disponible) {
        throw new Error("Cantidad solicitada excede el stock disponible.");
    }
    if (cantidad <= 0) {
         // Si la cantidad es 0 o menos, lo eliminamos
         return Carrito.removeItem(id_carrito, id_producto);
    }

    // Usamos INSERT ... ON DUPLICATE KEY UPDATE para añadir o actualizar
    const sql = `
        INSERT INTO detalle_carrito (id_carrito, id_producto, cantidad) 
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE cantidad = ? 
    `;
    // En caso de duplicado (mismo id_carrito, id_producto), actualiza la cantidad
    await pool.query(sql, [id_carrito, id_producto, cantidad, cantidad]);
};

/**
 * Elimina un item del detalle del carrito.
 * @param {number} id_carrito
 * @param {number} id_producto
 */
Carrito.removeItem = async (id_carrito, id_producto) => {
    await pool.query(
        'DELETE FROM detalle_carrito WHERE id_carrito = ? AND id_producto = ?',
        [id_carrito, id_producto]
    );
};

/**
 * Elimina TODOS los items de un carrito (usado después del checkout).
 * @param {number} id_carrito
 */
Carrito.clearCart = async (id_carrito) => {
    await pool.query('DELETE FROM detalle_carrito WHERE id_carrito = ?', [id_carrito]);
    // Opcional: También podríamos borrar la cabecera en carrito_compra
    // await pool.query('DELETE FROM carrito_compra WHERE id_carrito = ?', [id_carrito]);
};

module.exports = Carrito;