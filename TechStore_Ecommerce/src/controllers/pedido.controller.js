// src/controllers/pedido.controller.js
const Pedido = require('../models/pedido.model');
const Direccion = require('../models/direccion.model');
const Tarjeta = require('../models/tarjeta.model');
const Carrito = require('../models/carrito.model');
const { buildInvoice } = require('../utils/pdf.utils');
const { enviarCorreoConfirmacion } = require('../utils/email.utils');
const axios = require('axios'); // Asegúrate de haber instalado: npm install axios

const pedidoController = {};

// GET /pedido/checkout
pedidoController.mostrarCheckout = async (req, res) => {
    const cart = req.session.cart;
    if (!cart || cart.items.length === 0) {
        return res.redirect('/carrito?error=Tu carrito está vacío.');
    }

    try {
        const id_usuario = req.session.user.id_usuario;
        
        // 1. Obtener Direcciones y Tarjetas guardadas
        const [direcciones, tarjetas] = await Promise.all([
            Direccion.findByUsuarioId(id_usuario),
            Tarjeta.findByUsuarioId(id_usuario)
        ]);

        res.render('checkout', {
            title: 'Confirmar Pedido - TechStore',
            carrito: cart,
            user: req.session.user,
            direcciones: direcciones, // Pasamos lista
            tarjetas: tarjetas,       // Pasamos lista
            error: null
        });
    } catch (error) {
        console.error(error);
        res.redirect('/carrito?error=Error al cargar checkout.');
    }
};

// POST /pedido/procesar
pedidoController.procesarPedido = async (req, res) => {
    const cart = req.session.cart;
    const id_usuario = req.session.user.id_usuario;
    const { 
        id_direccion, id_tarjeta, cvv, 
        tipo_comprobante, ruc, razon_social, direccion_fiscal 
    } = req.body;

    // --- VALIDACIONES ---
    if (!cart || cart.items.length === 0) return res.redirect('/carrito');
    if (!id_direccion) return res.redirect('/pedido/checkout?error=Selecciona una dirección.');
    if (!id_tarjeta || !cvv) return res.redirect('/pedido/checkout?error=Selecciona tarjeta e ingresa CVV.');
    if (cvv.length !== 3) return res.redirect('/pedido/checkout?error=CVV inválido (debe ser 3 dígitos).');
    
    if (tipo_comprobante === 'Factura' && (!ruc || !razon_social)) {
        return res.redirect('/pedido/checkout?error=Para Factura, el RUC y Razón Social son obligatorios.');
    }

    try {
        // 1. Obtener datos completos de Dirección y Tarjeta para guardar histórico
        // (En un sistema real, guardaríamos el ID, pero aquí simulamos persistencia del texto)
        // Por simplicidad, asumimos que existen si llegaron los IDs.

        // 2. Crear Pedido en BD (Transacción + PEPS)
        // Pasamos los datos extra al modelo (tendremos que actualizar el modelo)
        const datosExtra = {
            tipo_comprobante,
            ruc: tipo_comprobante === 'Factura' ? ruc : null,
            razon_social: tipo_comprobante === 'Factura' ? razon_social : null,
            direccion_fiscal: tipo_comprobante === 'Factura' ? direccion_fiscal : null,
            id_direccion_seleccionada: id_direccion // Pasamos el ID para vincular si queremos
        };

        const id_pedido = await Pedido.create(id_usuario, cart, datosExtra);

        // 3. Generar PDF en Memoria (Buffer)
        const buffers = [];
        const pdfStream = new require('stream').PassThrough();
        
        pdfStream.on('data', buffers.push.bind(buffers));
        pdfStream.on('end', async () => {
            const pdfBuffer = Buffer.concat(buffers);

            // 4. Enviar Correo (Asíncrono, no bloqueamos la respuesta)
          const datosCorreo = {
                id_pedido,
                nombre: req.session.user.nombre,
                total: cart.total.toFixed(2),
                items: cart.items, // <--- IMPORTANTE: Ahora pasamos los items para la tabla HTML
                tipo_comprobante,
                shipping: {
                    name: tipo_comprobante === 'Factura' ? razon_social : req.session.user.nombre,
                    ruc: ruc,
                    company: razon_social
                },
                receiptType: tipo_comprobante
            };
            
            // Disparamos el correo (no esperamos con await para que sea rápido para el usuario)
          enviarCorreoConfirmacion(req.session.user.correo, datosCorreo, pdfBuffer);
        });

        // Construir PDF
        buildInvoice({
            orderId: id_pedido,
            shipping: {
                name: tipo_comprobante === 'Factura' ? razon_social : req.session.user.nombre,
                address: "Dirección Seleccionada", // Podrías buscar el texto real
                ruc: ruc,
                company: razon_social
            },
            items: cart.items,
            total: cart.total,
            receiptType: tipo_comprobante
        }, pdfStream);


        // 5. Limpiar Carrito y Redirigir
        req.session.cart = null;
        if (req.session.dbCartId) {
            await Carrito.clearCart(req.session.dbCartId);
        }

        res.render('pedido_exitoso', {
            title: 'Pedido Confirmado',
            id_pedido: id_pedido,
            user: req.session.user
        });

    } catch (error) {
        console.error('Error procesando pedido:', error);
        res.redirect(`/pedido/checkout?error=${encodeURIComponent(error.message)}`);
    }
};

// (GET /pedido/api/ruc/:numero)
    pedidoController.consultarRUC = async (req, res) => {
        const { numero } = req.params;
        // Leemos el token del archivo .env
        const token = process.env.APIS_PERU_TOKEN; 

        if (!token) {
            return res.status(500).json({ error: 'Token de API no configurado.' });
        }

        try {
            // 1. Petición a la nueva API (Decolecta)
            const response = await axios.get(`https://api.decolecta.com/v1/sunat/ruc?numero=${numero}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = response.data;

            // 2. Verificación básica (si la API devuelve éxito pero el RUC no existe)
            if (!data || !data.razon_social) {
                return res.status(404).json({ error: 'RUC no encontrado.' });
            }

            // 3. Transformación de datos (Backend Adapter)
            // Convertimos los campos de Decolecta (snake_case) a lo que espera tu vista (camelCase)
            const datosLimpios = {
                razonSocial: data.razon_social, // Mapeamos 'razon_social' a 'razonSocial'
                direccion: data.direccion,
                estado: data.estado,
                condicion: data.condicion
            };

            // Enviamos los datos limpios
            res.json(datosLimpios);

        } catch (error) {
            console.error('Error API Decolecta:', error.message);
            
            // Si falla la API real, activamos el modo manual en el frontend enviando un 404
            res.status(404).json({ error: 'Error al consultar la API.' });
        }
    };

module.exports = pedidoController;