// src/models/favorito.model.js
const pool = require('./db');

const Favorito = {};

// Obtener todos (ya lo tenías)
Favorito.findByUsuarioId = async (id_usuario) => {
    const sql = `
        SELECT f.id_favorito, f.fecha_agregado, p.id_producto, p.nombre_producto, p.precio, p.imagen
        FROM favorito f
        JOIN producto p ON f.id_producto = p.id_producto
        WHERE f.id_usuario = ?
        ORDER BY f.fecha_agregado DESC
    `;
    const [rows] = await pool.query(sql, [id_usuario]);
    return rows;
};

// ¡NUEVO! Verificar si un producto ya es favorito
Favorito.exists = async (id_usuario, id_producto) => {
    const sql = 'SELECT id_favorito FROM favorito WHERE id_usuario = ? AND id_producto = ?';
    const [rows] = await pool.query(sql, [id_usuario, id_producto]);
    return rows.length > 0;
};

// ¡NUEVO! Añadir a favoritos
Favorito.add = async (id_usuario, id_producto) => {
    const sql = 'INSERT INTO favorito (id_usuario, id_producto) VALUES (?, ?)';
    try {
        const [result] = await pool.query(sql, [id_usuario, id_producto]);
        return result.insertId;
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') return null; // Ya existía
        throw error;
    }
};

// ¡NUEVO! Eliminar de favoritos
Favorito.remove = async (id_usuario, id_producto) => {
    const sql = 'DELETE FROM favorito WHERE id_usuario = ? AND id_producto = ?';
    const [result] = await pool.query(sql, [id_usuario, id_producto]);
    return result.affectedRows;
};

module.exports = Favorito;