// src/models/tarjeta.model.js
const pool = require('./db');

const Tarjeta = {};

/**
 * ¡NUEVO! Obtiene TODAS las tarjetas de un usuario.
 * @param {number} id_usuario - ID del usuario a consultar.
 */
Tarjeta.findByUsuarioId = async (id_usuario) => {
    // Ordenamos por 'es_predeterminada' para mostrar esa primero
    const sql = `
        SELECT 
            id_tarjeta,
            nombre_titular,
            ultimos_cuatro_digitos,
            fecha_expiracion,
            tipo_tarjeta,
            es_predeterminada
        FROM tarjeta
        WHERE id_usuario = ?
        ORDER BY es_predeterminada DESC, fecha_agregado DESC
    `;

    try {
        const [rows] = await pool.query(sql, [id_usuario]);
        return rows;
    } catch (error) {
        console.error("Error al buscar tarjetas:", error.message);
        return []; // Devolver array vacío si falla
    }
};

Tarjeta.create = async (id_usuario, datos) => {
    const sql = `
        INSERT INTO tarjeta (
            id_usuario, nombre_titular, ultimos_cuatro_digitos, 
            fecha_expiracion, tipo_tarjeta, es_predeterminada
        ) VALUES (?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(sql, [
        id_usuario,
        datos.nombre_titular,
        datos.ultimos_cuatro_digitos,
        datos.fecha_expiracion,
        datos.tipo_tarjeta,
        datos.es_predeterminada || false
    ]);
    return result.insertId;
};

/**
 * ¡NUEVO! Elimina una tarjeta (solo si pertenece al usuario).
 */
Tarjeta.delete = async (id_tarjeta, id_usuario) => {
    const sql = 'DELETE FROM tarjeta WHERE id_tarjeta = ? AND id_usuario = ?';
    const [result] = await pool.query(sql, [id_tarjeta, id_usuario]);
    return result.affectedRows;
};

module.exports = Tarjeta;