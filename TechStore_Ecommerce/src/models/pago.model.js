// src/models/pago.model.js

const pool = require('./db');

const Pago = {};

/**
 * Registra un pago simulado y actualiza el estado del pedido a 'Pagado'.
 * Usa una transacción para asegurar consistencia.
 * @param {number} id_pedido
 * @param {string} metodo_pago - ('Tarjeta', 'Yape', 'Plin', 'Efectivo')
 * @param {object} pedidoData - Datos del pedido { total, tipo_comprobante }
 */
Pago.registrarPagoSimulado = async (id_pedido, metodo_pago, pedidoData) => {
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // 1. Verificar si el pedido sigue 'Pendiente' y dentro del tiempo límite
        const [pedidoRows] = await connection.query(
            `SELECT estado, fecha_limite_pago FROM pedido WHERE id_pedido = ? FOR UPDATE`,
            [id_pedido]
        );

        if (pedidoRows.length === 0) {
            throw new Error("Pedido no encontrado.");
        }
        if (pedidoRows[0].estado !== 'Pendiente') {
            throw new Error(`El pedido ya no está pendiente (Estado actual: ${pedidoRows[0].estado}).`);
        }
        if (new Date() > new Date(pedidoRows[0].fecha_limite_pago)) {
            throw new Error("El tiempo límite para pagar este pedido ha expirado.");
            // (La cancelación automática debería manejar esto eventualmente)
        }

        // 2. Determinar id_comprobante (Asumimos 1=Boleta, 2=Factura)
        const id_comprobante = pedidoData.tipo_comprobante === 'Factura' ? 2 : 1;

        // 3. Calcular subtotal e impuesto (Ejemplo simple con IGV 18%)
        const igvRate = 0.18;
        const total = pedidoData.total;
        const sub_total = total / (1 + igvRate);
        const impuesto = total - sub_total;

        // 4. Insertar en la tabla 'pago'
        const sqlInsertPago = `
            INSERT INTO pago (
                id_pedido, id_comprobante, id_descuento, metodo_pago,
                sub_total, impuesto, total, fecha
            ) VALUES (?, ?, NULL, ?, ?, ?, ?, NOW())
        `; // Asumimos sin descuento (id_descuento = NULL) por ahora
        await connection.query(sqlInsertPago, [
            id_pedido, id_comprobante, metodo_pago,
            sub_total, impuesto, total
        ]);

        // 5. Actualizar estado del pedido a 'Pagado'
        const sqlUpdatePedido = `UPDATE pedido SET estado = 'Pagado' WHERE id_pedido = ?`;
        await connection.query(sqlUpdatePedido, [id_pedido]);

        // 6. Confirmar transacción
        await connection.commit();

        return true; // Indicar éxito

    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Error registrando pago:", error);
        throw error; // Re-lanzar para el controlador
    } finally {
        if (connection) connection.release();
    }
};

module.exports = Pago;