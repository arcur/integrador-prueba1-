// src/models/favorito.model.js
const pool = require('./db');

const Favorito = {};

/**
 * ¡NUEVO! Obtiene TODOS los productos favoritos de un usuario.
 * @param {number} id_usuario - ID del usuario a consultar.
 */
Favorito.findByUsuarioId = async (id_usuario) => {
    // Hacemos un JOIN para obtener los datos del producto
    const sql = `
        SELECT 
            f.id_favorito,
            f.fecha_agregado,
            p.id_producto,
            p.nombre_producto,
            p.precio,
            p.imagen
        FROM favorito f
        JOIN producto p ON f.id_producto = p.id_producto
        WHERE f.id_usuario = ?
        ORDER BY f.fecha_agregado DESC
    `;

    try {
        const [rows] = await pool.query(sql, [id_usuario]);
        return rows;
    } catch (error) {
        // Si algo falla, devolvemos un array vacío.
        console.error("Error al buscar favoritos:", error.message);
        return [];
    }
};

module.exports = Favorito;