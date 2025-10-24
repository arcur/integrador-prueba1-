// src/models/proveedor.model.js

const pool = require('./db');

const Proveedor = {};

/**
 * Obtener todos los proveedores.
 */
Proveedor.getAll = async () => {
    const sql = 'SELECT * FROM proveedor ORDER BY nombre_proveedor ASC';
    const [rows] = await pool.query(sql);
    return rows;
};

/**
 * Obtener un proveedor por su ID.
 */
Proveedor.getById = async (id_proveedor) => {
    const sql = 'SELECT * FROM proveedor WHERE id_proveedor = ?';
    const [rows] = await pool.query(sql, [id_proveedor]);
    return rows[0];
};

/**
 * Crear un nuevo proveedor.
 */
Proveedor.create = async (newProveedor) => {
    const sql = `
        INSERT INTO proveedor (
            nombre_proveedor, ruc, numero_contacto, direccion
        ) VALUES (?, ?, ?, ?)
    `;
    const [result] = await pool.query(sql, [
        newProveedor.nombre_proveedor,
        newProveedor.ruc || null, // Permitir RUC nulo
        newProveedor.numero_contacto,
        newProveedor.direccion
    ]);
    return result.insertId;
};

/**
 * Actualizar un proveedor existente.
 */
Proveedor.update = async (id_proveedor, proveedorData) => {
    const sql = `
        UPDATE proveedor SET
            nombre_proveedor = ?,
            ruc = ?,
            numero_contacto = ?,
            direccion = ?
        WHERE id_proveedor = ?
    `;
    const [result] = await pool.query(sql, [
        proveedorData.nombre_proveedor,
        proveedorData.ruc || null,
        proveedorData.numero_contacto,
        proveedorData.direccion,
        id_proveedor
    ]);
    return result.affectedRows;
};

/**
 * Eliminar un proveedor.
 * (OJO: Si se borra, la FK en lote_producto se pondrá a NULL)
 */
Proveedor.delete = async (id_proveedor) => {
    // Podríamos añadir una validación para no borrar si tiene lotes asociados,
    // pero la DB ya lo maneja con ON DELETE SET NULL.
    const sql = 'DELETE FROM proveedor WHERE id_proveedor = ?';
    const [result] = await pool.query(sql, [id_proveedor]);
    return result.affectedRows;
};

module.exports = Proveedor;