// src/models/reporte.model.js
// (ACTUALIZADO con datos para Reportes CSV)

const pool = require('./db');

const Reporte = {};

/**
 * Obtiene las estadísticas principales para las "Stat Cards".
 * (Sin cambios)
 */
Reporte.getEstadisticasPrincipales = async () => {
    const sql = `
        SELECT 
            (SELECT IFNULL(SUM(total), 0) FROM pedido WHERE estado IN ('Pagado', 'Enviado')) AS totalIngresos,
            (SELECT COUNT(id_pedido) FROM pedido) AS totalPedidos,
            (SELECT COUNT(id_usuario) FROM usuario WHERE id_rol = 1) AS totalClientes,
            (SELECT IFNULL(SUM(lp.cantidad_actual), 0) FROM lote_producto lp) AS stockTotalUnidades
    `;
    const [rows] = await pool.query(sql);
    return rows[0];
};

/**
 * Obtiene los 5 productos más vendidos.
 * (Sin cambios)
 */
Reporte.getTopProductos = async () => {
    const sql = `
        SELECT 
            p.nombre_producto, SUM(dp.cantidad) AS total_vendido
        FROM detalle_pedido dp
        JOIN producto p ON dp.id_producto = p.id_producto
        JOIN pedido pe ON dp.id_pedido = pe.id_pedido
        WHERE pe.estado IN ('Pagado', 'Enviado')
        GROUP BY p.nombre_producto ORDER BY total_vendido DESC LIMIT 5
    `;
    const [rows] = await pool.query(sql);
    return rows;
};

/**
 * Obtiene los datos de ventas de los últimos 7 días para el gráfico.
 * (Sin cambios)
 */
Reporte.getVentasUltimos7Dias = async () => {
    const sql = `
        SELECT 
            DATE(fecha) AS dia, SUM(total) AS total_dia
        FROM pedido
        WHERE estado IN ('Pagado', 'Enviado') AND fecha >= CURDATE() - INTERVAL 7 DAY
        GROUP BY DATE(fecha) ORDER BY dia ASC
    `;
    const [rows] = await pool.query(sql);
    return rows;
};


// ===============================================
// --- NUEVAS FUNCIONES PARA REPORTES CSV ---
// ===============================================

/**
 * ¡NUEVO! Obtiene TODOS los productos con su stock total (para Reporte Inventario).
 */
Reporte.getInventarioCompleto = async () => {
    // Reutilizamos la consulta de getAllForAdmin pero simplificada
    const sql = `
        SELECT 
            p.id_producto AS ID,
            p.nombre_producto AS Producto,
            c.nombre_categoria AS Categoria,
            p.precio AS PrecioVenta,
            IFNULL((SELECT SUM(lp.cantidad_actual) 
                    FROM lote_producto lp 
                    WHERE lp.id_producto = p.id_producto AND lp.cantidad_actual > 0), 0) AS StockActual
        FROM producto p
        LEFT JOIN categoria c ON p.id_categoria = c.id_categoria
        ORDER BY Producto ASC
    `;
    const [rows] = await pool.query(sql);
    return rows; // Retorna array de objetos listos para CSV
};

/**
 * ¡NUEVO! Obtiene TODOS los pedidos (Pagados/Enviados) en un rango de fechas.
 * @param {string} fechaInicio - Formato 'YYYY-MM-DD'
 * @param {string} fechaFin - Formato 'YYYY-MM-DD'
 */
Reporte.getVentasPorFechas = async (fechaInicio, fechaFin) => {
    // Aseguramos que fechaFin incluya todo el día
    const fechaFinCompleta = `${fechaFin} 23:59:59`;
    
    const sql = `
        SELECT 
            p.id_pedido AS ID_Pedido,
            DATE_FORMAT(p.fecha, '%Y-%m-%d %H:%i:%s') AS Fecha,
            CONCAT(u.nombre, ' ', u.apellido_paterno) AS Cliente,
            u.numero_dni AS DNI_Cliente,
            p.total AS Total_Venta,
            p.estado AS Estado
        FROM pedido p
        LEFT JOIN usuario u ON p.id_usuario = u.id_usuario
        WHERE 
            p.estado IN ('Pagado', 'Enviado') AND
            p.fecha BETWEEN ? AND ?
        ORDER BY p.fecha ASC
    `;
    const [rows] = await pool.query(sql, [fechaInicio, fechaFinCompleta]);
    return rows;
};


/**
 * Obtiene los movimientos (Entradas y Salidas) para el Kardex Valorizado.
 * Ordenado cronológicamente para cálculo de saldos.
 */
Reporte.getMovimientosKardex = async (id_producto, fechaInicio, fechaFin) => {
    // Aseguramos formato de fechas
    const start = `${fechaInicio} 00:00:00`;
    const end = `${fechaFin} 23:59:59`;

    const sql = `
        SELECT * FROM (
            -- 1. ENTRADAS (Compras a proveedores o Devoluciones de pedidos)
            SELECT 
                lp.fecha_ingreso as fecha,
                CASE 
                    WHEN lp.id_proveedor IS NULL THEN 'DEVOLUCION' 
                    ELSE 'COMPRA' 
                END as tipo_movimiento,
                CONCAT('LOTE-', lp.id_lote) as documento,
                lp.cantidad_recibida as cantidad,
                lp.precio_compra as costo_unitario,
                0 as precio_venta, -- Las compras no tienen precio de venta
                'ENTRADA' as flujo
            FROM lote_producto lp
            WHERE lp.id_producto = ? 
            AND lp.fecha_ingreso BETWEEN ? AND ?

            UNION ALL

            -- 2. SALIDAS (Ventas confirmadas)
            SELECT 
                p.fecha,
                'VENTA' as tipo_movimiento,
                CONCAT('PEDIDO-', p.id_pedido) as documento,
                dp.cantidad,
                dp.costo_unitario, -- Este es el costo calculado por PEPS
                dp.precio_unitario as precio_venta,
                'SALIDA' as flujo
            FROM detalle_pedido dp
            JOIN pedido p ON dp.id_pedido = p.id_pedido
            WHERE dp.id_producto = ?
            AND p.estado IN ('Pagado', 'Enviado', 'Entregado') -- Solo ventas reales
            AND p.fecha BETWEEN ? AND ?
        ) as movimientos
        ORDER BY fecha ASC
    `;

    const [rows] = await pool.query(sql, [id_producto, start, end, id_producto, start, end]);
    return rows;
};


module.exports = Reporte;