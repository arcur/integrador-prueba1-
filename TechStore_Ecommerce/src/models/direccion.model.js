const pool = require('./db');

const Direccion = {};

// Obtener todas las direcciones de un usuario
Direccion.findByUsuarioId = async (id_usuario) => {
    const sql = `
        SELECT * FROM direccion_usuario 
        WHERE id_usuario = ? 
        ORDER BY es_predeterminada DESC, id_direccion DESC
    `;
    const [rows] = await pool.query(sql, [id_usuario]);
    return rows;
};

// Crear nueva dirección
Direccion.create = async (id_usuario, data) => {
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // Si esta es predeterminada, quitar predeterminada a las otras
        if (data.es_predeterminada) {
            await connection.query(
                'UPDATE direccion_usuario SET es_predeterminada = FALSE WHERE id_usuario = ?',
                [id_usuario]
            );
        }

        const sql = `
            INSERT INTO direccion_usuario (id_usuario, direccion, referencia, ciudad, es_predeterminada)
            VALUES (?, ?, ?, ?, ?)
        `;
        
        const [result] = await connection.query(sql, [
            id_usuario,
            data.direccion,
            data.referencia,
            data.ciudad,
            data.es_predeterminada
        ]);

        await connection.commit();
        return result.insertId;

    } catch (error) {
        if (connection) await connection.rollback();
        throw error;
    } finally {
        if (connection) connection.release();
    }
};

// Eliminar dirección
Direccion.delete = async (id_direccion, id_usuario) => {
    const sql = 'DELETE FROM direccion_usuario WHERE id_direccion = ? AND id_usuario = ?';
    const [result] = await pool.query(sql, [id_direccion, id_usuario]);
    return result.affectedRows;
};

module.exports = Direccion;