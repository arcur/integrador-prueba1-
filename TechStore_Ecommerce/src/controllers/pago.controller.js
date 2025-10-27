// src/controllers/pago.controller.js

const Pedido = require('../models/pedido.model');
const Pago = require('../models/pago.model');

const pagoController = {};

/**
 * Muestra la página de simulación de pago para un pedido específico.
 * (GET /pago/:id)
 */
pagoController.mostrarPaginaPago = async (req, res) => {
    try {
        const id_pedido = req.params.id;
        const id_usuario = req.session.user.id_usuario;

        // Obtener datos básicos del pedido (incluyendo id_usuario para verificar)
        const [pedidoRows] = await pool.query( // Usar pool directamente para consulta simple
            'SELECT id_pedido, total, estado, fecha_limite_pago, id_usuario, tipo_comprobante FROM pedido WHERE id_pedido = ?',
            [id_pedido]
        );

        if (pedidoRows.length === 0 || pedidoRows[0].id_usuario !== id_usuario) {
            req.flash('error_msg', 'Pedido no encontrado o no autorizado.');
            return res.redirect('/mis-pedidos');
        }

        const pedido = pedidoRows[0];

        // Verificar estado y tiempo límite
        if (pedido.estado !== 'Pendiente') {
             req.flash('error_msg', `Este pedido ya no está pendiente (Estado: ${pedido.estado}).`);
             // Redirigir al detalle del pedido si ya no está pendiente
             return res.redirect(`/mis-pedidos/${id_pedido}`);
        }
        if (new Date() > new Date(pedido.fecha_limite_pago)) {
             req.flash('error_msg', 'El tiempo para pagar este pedido ha expirado y será cancelado pronto.');
             // Podríamos cancelarlo aquí mismo o esperar al job automático
             return res.redirect(`/mis-pedidos/${id_pedido}`);
        }


        res.render('pago', { // Nueva vista
            title: `Pagar Pedido #${id_pedido}`,
            pedido: pedido,
            // Pasar fecha límite formateada (opcional)
            fechaLimiteFormateada: new Date(pedido.fecha_limite_pago).toLocaleString('es-PE', { hour12: true })
            // Mensajes flash ya disponibles
        });

    } catch (error) {
        console.error('Error al mostrar página de pago:', error);
        req.flash('error_msg', 'Error al cargar la página de pago.');
        res.redirect('/mis-pedidos');
    }
};

// Necesitamos importar pool al inicio si lo usamos directamente
const pool = require('../models/db');


/**
 * Procesa la simulación de pago.
 * (POST /pago/:id/procesar)
 */
pagoController.procesarPagoSimulado = async (req, res) => {
    try {
        const id_pedido = req.params.id;
        const id_usuario = req.session.user.id_usuario;
        const { metodo_pago } = req.body; // Método elegido por el usuario

        // 1. Validar método de pago
        const metodosValidos = ['Tarjeta', 'Yape', 'Plin', 'Efectivo']; // Ajusta según tu ENUM
        if (!metodo_pago || !metodosValidos.includes(metodo_pago)) {
            req.flash('error_msg', 'Método de pago no válido.');
            return res.redirect(`/pago/${id_pedido}`);
        }

        // 2. Obtener datos del pedido necesarios para registrar el pago
         const [pedidoRows] = await pool.query(
            'SELECT total, tipo_comprobante, id_usuario, estado FROM pedido WHERE id_pedido = ?',
            [id_pedido]
        );

         // Verificar que el pedido existe, pertenece al usuario y está pendiente
         if (pedidoRows.length === 0 || pedidoRows[0].id_usuario !== id_usuario ) {
             req.flash('error_msg', 'Pedido no encontrado o no autorizado.');
             return res.redirect('/mis-pedidos');
         }
          if (pedidoRows[0].estado !== 'Pendiente') {
             req.flash('error_msg', 'Este pedido ya no se puede pagar.');
             return res.redirect(`/mis-pedidos/${id_pedido}`);
         }

        // 3. Llamar al modelo para registrar el pago y actualizar el pedido
        await Pago.registrarPagoSimulado(id_pedido, metodo_pago, pedidoRows[0]);

        // 4. Redirigir a una página de éxito o al detalle del pedido pagado
        req.flash('success_msg', '¡Pago realizado con éxito! Tu pedido ha sido confirmado.');
        res.redirect(`/mis-pedidos/${id_pedido}`); // Redirigir al detalle

    } catch (error) { // Captura errores del modelo (ej: tiempo expirado, ya pagado)
        console.error('Error al procesar pago simulado:', error);
        req.flash('error_msg', `Error al procesar el pago: ${error.message}`);
        res.redirect(`/pago/${req.params.id}`); // Volver a la página de pago con el error
    }
};


module.exports = pagoController;