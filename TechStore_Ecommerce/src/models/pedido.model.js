// src/models/pedido.model.js
// (ACTUALIZADO con Devolución de Stock en Cancelación)

const pool = require('./db');

const Pedido = {};

/**
 * Modelo para crear un nuevo pedido (LÓGICA PEPS).
 * (Sin cambios)
 */
Pedido.create = async (id_usuario, cart) => {
    let connection; 
    const detallesParaInsertar = []; 

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // 1. Verificar Stock
        for (const item of cart.items) {
            const [rows] = await connection.query(
                `SELECT 
                    IFNULL((SELECT SUM(lp.cantidad_actual) 
                            FROM lote_producto lp 
                            WHERE lp.id_producto = p.id_producto AND lp.cantidad_actual > 0), 0) AS stock
                 FROM producto p
                 WHERE p.id_producto = ? FOR UPDATE`,
                [item.id_producto]
            );
            
            if (rows[0].stock < item.cantidad) {
                await connection.rollback();
                throw new Error(`Stock insuficiente para: ${item.nombre_producto}. Stock disponible: ${rows[0].stock}`);
            }
        }
        
        // 2. Insertar Pedido (Cabecera)
        const sqlPedido = `
            INSERT INTO pedido (id_usuario, estado, total) 
            VALUES (?, 'Pendiente', ?)
        `;
        const [pedidoResult] = await connection.query(sqlPedido, [id_usuario, cart.total]);
        const id_pedido = pedidoResult.insertId;

        // 3. Lógica PEPS
        for (const item of cart.items) {
            const [lotes] = await connection.query(
                `SELECT id_lote, cantidad_actual, precio_compra 
                 FROM lote_producto 
                 WHERE id_producto = ? AND cantidad_actual > 0 
                 ORDER BY fecha_ingreso ASC 
                 FOR UPDATE`,
                [item.id_producto]
            );

            let cantidad_necesaria = item.cantidad;
            let costo_total_item = 0;

            for (const lote of lotes) {
                if (cantidad_necesaria === 0) break;
                const cantidad_a_consumir = Math.min(cantidad_necesaria, lote.cantidad_actual);

                const nueva_cantidad_lote = lote.cantidad_actual - cantidad_a_consumir;
                await connection.query(
                    'UPDATE lote_producto SET cantidad_actual = ? WHERE id_lote = ?',
                    [nueva_cantidad_lote, lote.id_lote]
                );
                
                costo_total_item += cantidad_a_consumir * lote.precio_compra;
                cantidad_necesaria -= cantidad_a_consumir;
            }
            
            const costo_unitario_promedio = costo_total_item / item.cantidad;

            detallesParaInsertar.push([
                id_pedido,
                item.id_producto,
                item.cantidad,
                item.precio,
                costo_unitario_promedio
            ]);
        }
        
        // 4. Insertar Detalle_Pedido
        const sqlDetalle = `
            INSERT INTO detalle_pedido (
                id_pedido, id_producto, cantidad, precio_unitario, costo_unitario
            ) VALUES ?
        `;
        await connection.query(sqlDetalle, [detallesParaInsertar]);
        
        await connection.commit();
        return id_pedido;

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        throw error; 
    
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

/**
 * Modelo para obtener TODOS los pedidos.
 * (Sin cambios)
 */
Pedido.getAll = async () => {
    const sql = `
        SELECT 
            p.id_pedido,
            p.fecha,
            p.estado,
            p.total,
            u.nombre AS cliente_nombre,
            u.apellido_paterno AS cliente_apellido
        FROM pedido p
        LEFT JOIN usuario u ON p.id_usuario = u.id_usuario
        ORDER BY p.fecha DESC
    `;
    
    const [rows] = await pool.query(sql);
    return rows;
};

/**
 * Modelo para obtener el detalle completo de UN pedido.
 * (Sin cambios)
 */
Pedido.getDetalleById = async (id_pedido) => {
    const sqlPedido = `
        SELECT 
            p.id_pedido, p.fecha, p.estado, p.total,
            u.nombre, u.apellido_paterno, u.apellido_materno,
            u.numero_dni, u.correo, u.telefono
        FROM pedido p
        LEFT JOIN usuario u ON p.id_usuario = u.id_usuario
        WHERE p.id_pedido = ?
    `;
    const [pedidoRows] = await pool.query(sqlPedido, [id_pedido]);
    
    if (pedidoRows.length === 0) { return null; }
    
    const sqlDetalles = `
        SELECT 
            d.id_producto, d.cantidad, d.precio_unitario, d.costo_unitario,
            pr.nombre_producto, pr.imagen
        FROM detalle_pedido d
        JOIN producto pr ON d.id_producto = pr.id_producto
        WHERE d.id_pedido = ?
    `;
    const [detalleRows] = await pool.query(sqlDetalles, [id_pedido]);
    
    return {
        pedido: pedidoRows[0],
        detalles: detalleRows
    };
};

/**
 * ¡MODIFICADO! Modelo para actualizar el ESTADO de un pedido.
 * Ahora incluye una transacción para la lógica de cancelación.
 * @param {number} id_pedido - ID del pedido a actualizar.
 * @param {string} nuevo_estado - ('Pagado', 'Enviado', 'Cancelado')
 */
Pedido.updateStatus = async (id_pedido, nuevo_estado) => {
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();
        
        // 1. Obtener el estado ACTUAL del pedido
        const [rows] = await connection.query(
            'SELECT estado FROM pedido WHERE id_pedido = ? FOR UPDATE', 
            [id_pedido]
        );
        const estado_actual = rows[0].estado;

        // 2. Lógica de Devolución de Stock (PEPS Inverso)
        // Si el nuevo estado es 'Cancelado' Y el estado actual NO ERA 'Cancelado'
        if (nuevo_estado === 'Cancelado' && estado_actual !== 'Cancelado') {
            
            // a. Obtener los detalles del pedido
            const [detalles] = await connection.query(
                'SELECT id_producto, cantidad, costo_unitario FROM detalle_pedido WHERE id_pedido = ?', 
                [id_pedido]
            );

            // b. Por cada producto, crear un nuevo lote de devolución
            for (const item of detalles) {
                const sqlInsertLote = `
                    INSERT INTO lote_producto (
                        id_producto, 
                        id_proveedor, 
                        cantidad_recibida, 
                        cantidad_actual, 
                        precio_compra, 
                        fecha_ingreso
                    ) VALUES (?, ?, ?, ?, ?, NOW())
                `;
                await connection.query(sqlInsertLote, [
                    item.id_producto,
                    null, // Proveedor nulo (es una devolución)
                    item.cantidad, // cantidad_recibida
                    item.cantidad, // cantidad_actual
                    item.costo_unitario // Usamos el costo guardado
                ]);
            }
        }
        
        // 3. (Opcional) Lógica si se "des-cancela" un pedido
        // Si el estado actual es 'Cancelado' y el nuevo NO LO ES,
        // tendríamos que volver a consumir el stock (PEPS).
        // Por ahora, no implementamos esta lógica; asumimos que una cancelación es final.

        // 4. Actualizar el estado del pedido
        const sqlUpdatePedido = `UPDATE pedido SET estado = ? WHERE id_pedido = ?`;
        const [result] = await connection.query(sqlUpdatePedido, [nuevo_estado, id_pedido]);
        
        await connection.commit();
        return result.affectedRows;

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        // Lanzamos el error para que el controlador lo atrape
        throw error;
    
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

module.exports = Pedido;