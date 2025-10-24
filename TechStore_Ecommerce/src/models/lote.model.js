// src/models/lote.model.js

const pool = require('./db');

const Lote = {};

/**
 * Modelo para obtener todos los lotes de un producto específico.
 * Se une con 'proveedor' para obtener el nombre.
 * Se ordena por 'fecha_ingreso' ASC para mostrar el PEPS (FIFO).
 * @param {number} id_producto - ID del producto a consultar.
 */
Lote.getByProductoId = async (id_producto) => {
    const sql = `
        SELECT 
            l.id_lote,
            l.cantidad_recibida,
            l.cantidad_actual,
            l.precio_compra,
            l.fecha_ingreso,
            p.nombre_proveedor
        FROM lote_producto l
        LEFT JOIN proveedor p ON l.id_proveedor = p.id_proveedor
        WHERE l.id_producto = ?
        ORDER BY l.fecha_ingreso ASC
    `;
    const [rows] = await pool.query(sql, [id_producto]);
    return rows;
};

/**
 * Modelo para crear un nuevo lote (ingreso de inventario).
 * @param {number} id_producto - ID del producto al que pertenece el lote.
 * @param {object} loteData - Datos del lote { id_proveedor, cantidad, precio_compra }
 */
Lote.create = async (id_producto, loteData) => {
    const { id_proveedor, cantidad_recibida, precio_compra } = loteData;
    
    const sql = `
        INSERT INTO lote_producto (
            id_producto, 
            id_proveedor, 
            cantidad_recibida, 
            cantidad_actual,  -- Al crear, la actual es igual a la recibida
            precio_compra
        ) VALUES (?, ?, ?, ?, ?)
    `;
    
    const [result] = await pool.query(sql, [
        id_producto,
        id_proveedor || null,
        cantidad_recibida,
        cantidad_recibida, // cantidad_actual = cantidad_recibida
        precio_compra
    ]);
    
    return result.insertId;
};

module.exports = Lote;