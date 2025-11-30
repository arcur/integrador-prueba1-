const pool = require('./db');

const Categoria = {};

Categoria.getAll = async () => {
    const [rows] = await pool.query('SELECT * FROM categoria ORDER BY id_categoria DESC');
    return rows;
};

Categoria.create = async (data) => {
    const sql = 'INSERT INTO categoria (nombre_categoria, descripcion_categoria) VALUES (?, ?)';
    const [result] = await pool.query(sql, [data.nombre_categoria, data.descripcion_categoria]);
    return result.insertId;
};

Categoria.update = async (id, data) => {
    const sql = 'UPDATE categoria SET nombre_categoria = ?, descripcion_categoria = ? WHERE id_categoria = ?';
    const [result] = await pool.query(sql, [data.nombre_categoria, data.descripcion_categoria, id]);
    return result.affectedRows;
};

Categoria.delete = async (id) => {
    // Nota: Podría fallar si hay productos asociados (Integridad referencial)
    const sql = 'DELETE FROM categoria WHERE id_categoria = ?';
    const [result] = await pool.query(sql, [id]);
    return result.affectedRows;
};

module.exports = Categoria;