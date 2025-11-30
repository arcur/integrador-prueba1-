const pool = require('./db');

const Descuento = {};

Descuento.getAll = async () => {
    const [rows] = await pool.query('SELECT * FROM descuento ORDER BY fecha_vencimiento DESC');
    return rows;
};

Descuento.create = async (data) => {
    const sql = `
        INSERT INTO descuento 
        (codigo, tipo_descuento, porcentaje_descuento, fecha_inicio, fecha_vencimiento, cantidad_disponible, monto_minimo) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(sql, [
        data.codigo.toUpperCase(), // Códigos en mayúscula siempre
        data.tipo_descuento,
        data.porcentaje_descuento,
        data.fecha_inicio,
        data.fecha_vencimiento,
        data.cantidad_disponible,
        data.monto_minimo
    ]);
    return result.insertId;
};

Descuento.delete = async (id) => {
    const sql = 'DELETE FROM descuento WHERE id_descuento = ?';
    const [result] = await pool.query(sql, [id]);
    return result.affectedRows;
};

// Función para validar cupón en el checkout (Para el futuro)
Descuento.validar = async (codigo) => {
    const sql = `
        SELECT * FROM descuento 
        WHERE codigo = ? 
        AND estado = 1
        AND cantidad_disponible > 0 
        AND CURDATE() BETWEEN fecha_inicio AND fecha_vencimiento
    `;
    const [rows] = await pool.query(sql, [codigo]);
    return rows[0];
};


// Disminuir la cantidad disponible del cupón
Descuento.disminuirStock = async (id_descuento) => {
    const sql = 'UPDATE descuento SET cantidad_disponible = cantidad_disponible - 1 WHERE id_descuento = ?';
    const [result] = await pool.query(sql, [id_descuento]);
    return result.affectedRows;
};


module.exports = Descuento;