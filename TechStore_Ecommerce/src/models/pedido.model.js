// src/models/pedido.model.js
// (VERSIÓN FINAL COMPLETA - Revisada y Corregida)

const pool = require('./db');

const Pedido = {};

// Subconsulta reutilizable para calcular el stock total
const STOCK_TOTAL_QUERY = `
    (SELECT SUM(lp.cantidad_actual)
     FROM lote_producto lp
     WHERE lp.id_producto = p.id_producto AND lp.cantidad_actual > 0)
`;

/**
 * Modelo para crear un nuevo pedido (LÓgica PEPS).
 * Guarda dirección, comprobante y fecha límite. Estado inicial: Pendiente.
 */
Pedido.create = async (id_usuario, cart, checkoutData) => {
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
                 WHERE p.id_producto = ? FOR UPDATE`, [item.id_producto]
            );
            if (!rows || rows.length === 0 || rows[0].stock < item.cantidad) { // Verificación robusta
                await connection.rollback();
                const stockDisponible = (rows && rows.length > 0) ? rows[0].stock : 0;
                throw new Error(`Stock insuficiente para: ${item.nombre_producto}. Stock disponible: ${stockDisponible}`);
            }
        }

        // 2. Insertar Pedido (Cabecera)
        const sqlPedido = `
            INSERT INTO pedido (
                id_usuario, direccion_envio, tipo_comprobante, estado, total, fecha_limite_pago
            ) VALUES (?, ?, ?, 'Pendiente', ?, NOW() + INTERVAL 5 HOUR)
        `;
        const [pedidoResult] = await connection.query(sqlPedido, [
            id_usuario, checkoutData.direccion_envio, checkoutData.tipo_comprobante, cart.total
        ]);
        const id_pedido = pedidoResult.insertId;

        // 3. Lógica PEPS
        for (const item of cart.items) {
            const [lotes] = await connection.query(
                `SELECT id_lote, cantidad_actual, precio_compra
                 FROM lote_producto
                 WHERE id_producto = ? AND cantidad_actual > 0
                 ORDER BY fecha_ingreso ASC
                 FOR UPDATE`, [item.id_producto]
            );
            let cantidad_necesaria = item.cantidad; let costo_total_item = 0;
            for (const lote of lotes) {
                 if (cantidad_necesaria <= 0) break; // Usar <= 0
                 const cantidad_a_consumir = Math.min(cantidad_necesaria, lote.cantidad_actual);
                 if (cantidad_a_consumir <= 0) continue; // Saltar si no se consume nada

                 const nueva_cantidad_lote = lote.cantidad_actual - cantidad_a_consumir;
                 await connection.query(
                    'UPDATE lote_producto SET cantidad_actual = ? WHERE id_lote = ?',
                    [nueva_cantidad_lote, lote.id_lote]
                 );
                 costo_total_item += cantidad_a_consumir * lote.precio_compra;
                 cantidad_necesaria -= cantidad_a_consumir;
             }
             // Asegurarse de que se pudo satisfacer la cantidad necesaria
             if (cantidad_necesaria > 0) {
                 await connection.rollback(); // No debería pasar si la verificación inicial fue correcta, pero por seguridad
                 throw new Error(`No se pudo asignar stock suficiente para ${item.nombre_producto} durante la transacción PEPS.`);
             }

             const costo_unitario_promedio = (item.cantidad > 0) ? (costo_total_item / item.cantidad) : 0; // Evitar división por cero
             detallesParaInsertar.push([id_pedido, item.id_producto, item.cantidad, item.precio, costo_unitario_promedio]);
        }

        // 4. Insertar Detalle_Pedido
        if (detallesParaInsertar.length > 0) { // Solo insertar si hay detalles
             const sqlDetalle = `
                INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad, precio_unitario, costo_unitario) VALUES ?`;
             await connection.query(sqlDetalle, [detallesParaInsertar]);
        } else {
             // Si por alguna razón el carrito estaba vacío pero pasó la validación inicial (raro)
             await connection.rollback();
             throw new Error('No hay productos en el carrito para crear el pedido.');
        }

        await connection.commit();
        return id_pedido; // <-- RETORNA ID

    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Error creating order:", error); // Loggear error
        throw error; // Re-lanzar
    } finally {
        if (connection) connection.release();
    }
};

/**
 * Modelo para obtener TODOS los pedidos (para Admin).
 */
Pedido.getAll = async () => {
    const sql = `
        SELECT
            p.id_pedido, p.fecha, p.estado, p.total,
            u.nombre AS cliente_nombre, u.apellido_paterno AS cliente_apellido
        FROM pedido p
        LEFT JOIN usuario u ON p.id_usuario = u.id_usuario
        ORDER BY p.fecha DESC
    `;
    const [rows] = await pool.query(sql);
    return rows; // <-- ASEGÚRATE DE QUE ESTÉ ESTE RETURN
};

/**
 * Modelo para obtener el detalle completo de UN pedido.
 */
/**
 * Modelo para obtener el detalle completo de UN pedido.
 * (ACTUALIZADO para incluir método de pago y dirección de envío si está en pedido)
 */
Pedido.getDetalleById = async (id_pedido) => {
    // Consulta principal uniendo pedido, usuario y pago
    const sqlPedido = `
        SELECT
            p.id_pedido, p.fecha, p.estado, p.total, p.id_usuario,
            p.direccion_envio, p.tipo_comprobante, -- Campos de pedido
            u.nombre, u.apellido_paterno, u.apellido_materno,
            u.numero_dni, u.correo, u.telefono,
            pg.metodo_pago -- Campo de la tabla pago
        FROM pedido p
        LEFT JOIN usuario u ON p.id_usuario = u.id_usuario
        LEFT JOIN pago pg ON p.id_pedido = pg.id_pedido -- Unir con pago
        WHERE p.id_pedido = ?
        LIMIT 1 -- Asegura solo una fila si hubiera múltiples pagos (no debería)
    `;
    const [pedidoRows] = await pool.query(sqlPedido, [id_pedido]);
    if (pedidoRows.length === 0) return null;

    // Consulta para los productos del pedido
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
        pedido: pedidoRows[0], // Contiene ahora direccion_envio y metodo_pago
        detalles: detalleRows
    };
};

/**
 * Modelo para actualizar el ESTADO de un pedido (con cancelación).
 */
Pedido.updateStatus = async (id_pedido, nuevo_estado) => {
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();
        const [rows] = await connection.query('SELECT estado FROM pedido WHERE id_pedido = ? FOR UPDATE', [id_pedido]);

        if (rows.length === 0) throw new Error("Pedido no encontrado."); // Añadir verificación
        const estado_actual = rows[0].estado;

        // Solo reponer si se cancela un pedido que NO estaba ya cancelado
        if (nuevo_estado === 'Cancelado' && estado_actual !== 'Cancelado') {
            const [detalles] = await connection.query(
                'SELECT id_producto, cantidad, costo_unitario FROM detalle_pedido WHERE id_pedido = ?',
                [id_pedido]
            );
            for (const item of detalles) {
                // Asegurarse que costo_unitario no sea null o undefined
                const costo = item.costo_unitario != null ? item.costo_unitario : 0;
                 const sqlInsertLote = `INSERT INTO lote_producto (id_producto, id_proveedor, cantidad_recibida, cantidad_actual, precio_compra, fecha_ingreso) VALUES (?, NULL, ?, ?, ?, NOW())`;
                 await connection.query(sqlInsertLote, [item.id_producto, item.cantidad, item.cantidad, costo]);
            }
        }

        const sqlUpdatePedido = `UPDATE pedido SET estado = ? WHERE id_pedido = ?`;
        const [result] = await connection.query(sqlUpdatePedido, [nuevo_estado, id_pedido]);
        await connection.commit();
        return result.affectedRows; // <-- RETORNA NÚMERO

    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Error updating order status:", error);
        throw error;
    } finally {
        if (connection) connection.release();
    }
};

/**
 * Modelo para obtener todos los pedidos de UN usuario (Cliente).
 */
Pedido.getByUserId = async (id_usuario) => {
    const sql = `
        SELECT
            id_pedido, fecha, estado, total
        FROM pedido
        WHERE id_usuario = ?
        ORDER BY fecha DESC
    `;
    const [rows] = await pool.query(sql, [id_usuario]);
    return rows; // <-- ASEGÚRATE DE QUE ESTÉ ESTE RETURN
};

/**
 * Modelo para cancelar pedidos pendientes vencidos (Scheduler).
 */
Pedido.cancelOverdueOrders = async () => {
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [overduePedidos] = await connection.query(
            `SELECT id_pedido FROM pedido WHERE estado = 'Pendiente' AND fecha_limite_pago < NOW() FOR UPDATE`
        );
        if (overduePedidos.length === 0) {
            await connection.commit(); return 0;
        }

        const idsToCancel = overduePedidos.map(p => p.id_pedido);
        console.log(`[Scheduler] Cancelling overdue orders: ${idsToCancel.join(', ')}`);

        const [detallesToRestore] = await connection.query(
            `SELECT id_pedido, id_producto, cantidad, costo_unitario FROM detalle_pedido WHERE id_pedido IN (?)`,
            [idsToCancel]
        );

        for (const item of detallesToRestore) {
             const costo = item.costo_unitario != null ? item.costo_unitario : 0;
             const sqlInsertLote = `INSERT INTO lote_producto (id_producto, id_proveedor, cantidad_recibida, cantidad_actual, precio_compra, fecha_ingreso) VALUES (?, NULL, ?, ?, ?, NOW())`;
             await connection.query(sqlInsertLote, [item.id_producto, item.cantidad, item.cantidad, costo]);
        }

        const [updateResult] = await connection.query(
            `UPDATE pedido SET estado = 'Cancelado' WHERE id_pedido IN (?)`,
            [idsToCancel]
        );

        await connection.commit();
        return updateResult.affectedRows; // <-- RETORNA NÚMERO

    } catch (error) {
        if (connection) await connection.rollback();
        console.error("[Scheduler] Error cancelling overdue orders:", error);
        // No relanzar para no detener el intervalo, solo loggear
        return 0; // Indicar 0 cancelados en caso de error
    } finally {
        if (connection) connection.release();
    }
};

Pedido.create = async (id_usuario, cart, checkoutData) => {
    let connection;
    const detallesParaInsertar = [];
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();
        for (const item of cart.items) {
            const [rows] = await connection.query(`SELECT IFNULL((SELECT SUM(lp.cantidad_actual) FROM lote_producto lp WHERE lp.id_producto = p.id_producto AND lp.cantidad_actual > 0), 0) AS stock FROM producto p WHERE p.id_producto = ? FOR UPDATE`, [item.id_producto]);
            if (!rows || rows.length === 0 || rows[0].stock < item.cantidad) { await connection.rollback(); const stockDisponible = (rows && rows.length > 0) ? rows[0].stock : 0; throw new Error(`Stock insuficiente para: ${item.nombre_producto}. Stock disponible: ${stockDisponible}`); }
        }
        const sqlPedido = `INSERT INTO pedido (id_usuario, direccion_envio, tipo_comprobante, estado, total, fecha_limite_pago) VALUES (?, ?, ?, 'Pendiente', ?, NOW() + INTERVAL 5 HOUR)`;
        const [pedidoResult] = await connection.query(sqlPedido, [id_usuario, checkoutData.direccion_envio, checkoutData.tipo_comprobante, cart.total]);
        const id_pedido = pedidoResult.insertId;
        for (const item of cart.items) {
            const [lotes] = await connection.query(`SELECT id_lote, cantidad_actual, precio_compra FROM lote_producto WHERE id_producto = ? AND cantidad_actual > 0 ORDER BY fecha_ingreso ASC FOR UPDATE`, [item.id_producto]);
            let cantidad_necesaria = item.cantidad; let costo_total_item = 0;
            for (const lote of lotes) {
                 if (cantidad_necesaria <= 0) break;
                 const cantidad_a_consumir = Math.min(cantidad_necesaria, lote.cantidad_actual);
                 if (cantidad_a_consumir <= 0) continue;
                 const nueva_cantidad_lote = lote.cantidad_actual - cantidad_a_consumir;
                 await connection.query('UPDATE lote_producto SET cantidad_actual = ? WHERE id_lote = ?', [nueva_cantidad_lote, lote.id_lote]);
                 costo_total_item += cantidad_a_consumir * lote.precio_compra;
                 cantidad_necesaria -= cantidad_a_consumir;
             }
             if (cantidad_necesaria > 0) { await connection.rollback(); throw new Error(`No se pudo asignar stock suficiente para ${item.nombre_producto} durante la transacción PEPS.`); }
             const costo_unitario_promedio = (item.cantidad > 0) ? (costo_total_item / item.cantidad) : 0;
             detallesParaInsertar.push([id_pedido, item.id_producto, item.cantidad, item.precio, costo_unitario_promedio]);
        }
        if (detallesParaInsertar.length > 0) {
             const sqlDetalle = `INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad, precio_unitario, costo_unitario) VALUES ?`;
             await connection.query(sqlDetalle, [detallesParaInsertar]);
        } else { await connection.rollback(); throw new Error('No hay productos en el carrito para crear el pedido.'); }
        await connection.commit();
        return id_pedido;
    } catch (error) { if (connection) await connection.rollback(); console.error("Error creating order:", error); throw error; } finally { if (connection) connection.release(); }
};
Pedido.getAll = async () => { const sql = `SELECT p.id_pedido, p.fecha, p.estado, p.total, u.nombre AS cliente_nombre, u.apellido_paterno AS cliente_apellido FROM pedido p LEFT JOIN usuario u ON p.id_usuario = u.id_usuario ORDER BY p.fecha DESC`; const [rows] = await pool.query(sql); return rows; };
Pedido.updateStatus = async (id_pedido, nuevo_estado) => { let connection; try { connection = await pool.getConnection(); await connection.beginTransaction(); const [rows] = await connection.query('SELECT estado FROM pedido WHERE id_pedido = ? FOR UPDATE', [id_pedido]); if (rows.length === 0) throw new Error("Pedido no encontrado."); const estado_actual = rows[0].estado; if (nuevo_estado === 'Cancelado' && estado_actual !== 'Cancelado') { const [detalles] = await connection.query('SELECT id_producto, cantidad, costo_unitario FROM detalle_pedido WHERE id_pedido = ?', [id_pedido]); for (const item of detalles) { const costo = item.costo_unitario != null ? item.costo_unitario : 0; const sqlInsertLote = `INSERT INTO lote_producto (id_producto, id_proveedor, cantidad_recibida, cantidad_actual, precio_compra, fecha_ingreso) VALUES (?, NULL, ?, ?, ?, NOW())`; await connection.query(sqlInsertLote, [item.id_producto, item.cantidad, item.cantidad, costo]); } } const sqlUpdatePedido = `UPDATE pedido SET estado = ? WHERE id_pedido = ?`; const [result] = await connection.query(sqlUpdatePedido, [nuevo_estado, id_pedido]); await connection.commit(); return result.affectedRows; } catch (error) { if (connection) await connection.rollback(); console.error("Error updating order status:", error); throw error; } finally { if (connection) connection.release(); } };
Pedido.getByUserId = async (id_usuario) => { const sql = `SELECT id_pedido, fecha, estado, total FROM pedido WHERE id_usuario = ? ORDER BY fecha DESC`; const [rows] = await pool.query(sql, [id_usuario]); return rows; };
Pedido.cancelOverdueOrders = async () => { let connection; try { connection = await pool.getConnection(); await connection.beginTransaction(); const [overduePedidos] = await connection.query(`SELECT id_pedido FROM pedido WHERE estado = 'Pendiente' AND fecha_limite_pago < NOW() FOR UPDATE`); if (overduePedidos.length === 0) { await connection.commit(); return 0; } const idsToCancel = overduePedidos.map(p => p.id_pedido); console.log(`[Scheduler] Cancelling overdue orders: ${idsToCancel.join(', ')}`); const [detallesToRestore] = await connection.query(`SELECT id_pedido, id_producto, cantidad, costo_unitario FROM detalle_pedido WHERE id_pedido IN (?)`, [idsToCancel]); for (const item of detallesToRestore) { const costo = item.costo_unitario != null ? item.costo_unitario : 0; const sqlInsertLote = `INSERT INTO lote_producto (id_producto, id_proveedor, cantidad_recibida, cantidad_actual, precio_compra, fecha_ingreso) VALUES (?, NULL, ?, ?, ?, NOW())`; await connection.query(sqlInsertLote, [item.id_producto, item.cantidad, item.cantidad, costo]); } const [updateResult] = await connection.query(`UPDATE pedido SET estado = 'Cancelado' WHERE id_pedido IN (?)`, [idsToCancel]); await connection.commit(); return updateResult.affectedRows; } catch (error) { if (connection) await connection.rollback(); console.error("[Scheduler] Error cancelling overdue orders:", error); return 0; } finally { if (connection) connection.release(); } };
// --- FIN Código Completo ---


module.exports = Pedido;