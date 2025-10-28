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

module.exports = Tarjeta;