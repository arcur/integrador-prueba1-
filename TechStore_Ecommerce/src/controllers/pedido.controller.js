// src/controllers/pedido.controller.js
const Pedido = require('../models/pedido.model');
const Direccion = require('../models/direccion.model');
const Tarjeta = require('../models/tarjeta.model');
const Carrito = require('../models/carrito.model');
const { buildInvoice } = require('../utils/pdf.utils');
const { enviarCorreoConfirmacion } = require('../utils/email.utils');
const axios = require('axios'); // Asegúrate de haber instalado: npm install axios
const Descuento = require('../models/descuento.model'); // <-- AÑADIR

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
        tipo_comprobante, ruc, razon_social, direccion_fiscal,
        codigo_cupon // <-- Recibimos el código del form
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
       


        let totalFinal = cart.total;
        let descuentoAplicado = 0;
        let idDescuentoAplicado = null;

        // --- LÓGICA DE CUPÓN (SERVIDOR) ---
        // Validamos de nuevo por seguridad (no confiar solo en el frontend)
        if (codigo_cupon) {
            const cupon = await Descuento.validar(codigo_cupon);
            if (cupon && cart.total >= cupon.monto_minimo) {
                descuentoAplicado = (cart.total * cupon.porcentaje_descuento) / 100;
                totalFinal = cart.total - descuentoAplicado;
                idDescuentoAplicado = cupon.id_descuento;
                
                // RESTAR STOCK DEL CUPÓN
                await Descuento.disminuirStock(cupon.id_descuento);
            }
        }
        // ----------------------------------

        const datosExtra = {
            tipo_comprobante,
            ruc: tipo_comprobante === 'Factura' ? ruc : null,
            razon_social: tipo_comprobante === 'Factura' ? razon_social : null,
            direccion_fiscal: tipo_comprobante === 'Factura' ? direccion_fiscal : null,
            id_direccion_seleccionada: id_direccion,
            
            // Pasamos los nuevos totales
            total_final: totalFinal,
            monto_descuento: descuentoAplicado,
            id_descuento: idDescuentoAplicado
        };

       const id_pedido = await Pedido.create(id_usuario, cart, datosExtra);

        // =========================================================
        // === INICIO DE CAMBIOS: CÁLCULOS IGV Y DATOS UNIFICADOS ===
        // =========================================================

        const totalPagar = totalFinal; // Este es el total FINAL (con descuento si hubo)
        const descuento = descuentoAplicado; // Monto descontado
        
        // Matemáticas SUNAT (IGV 18% incluido)
        // Valor Venta (Base Imponible) = Total / 1.18
        const valorVenta = totalPagar / 1.18;
        const igv = totalPagar - valorVenta;

        // Creamos un ÚNICO objeto con todos los datos calculados
        const datosDocumento = {
            id_pedido,
            nombre: req.session.user.nombre,
            
            // Totales formateados para mostrar (Strings con 2 decimales)
            subtotal_productos: cart.total.toFixed(2), // Precio original
            descuento: descuento.toFixed(2),
            valor_venta: valorVenta.toFixed(2),        // Base imponible
            igv: igv.toFixed(2),                       // Impuesto
            total: totalPagar.toFixed(2),              // Total final
            
            items: cart.items,
            tipo_comprobante,
            shipping: {
                name: tipo_comprobante === 'Factura' ? razon_social : req.session.user.nombre,
                ruc: ruc,
                company: razon_social,
                address: "Dirección Seleccionada"
            },
            receiptType: tipo_comprobante
        };

        // 3. Generar PDF en Memoria (Buffer)
        const buffers = [];
        const pdfStream = new require('stream').PassThrough();
        
        pdfStream.on('data', buffers.push.bind(buffers));
        pdfStream.on('end', async () => {
            const pdfBuffer = Buffer.concat(buffers);

            // 4. Enviar Correo (Usando datosDocumento que ya tiene el IGV y Descuento)
            // Asegúrate de que req.session.user.correo exista (lo arreglamos en el paso anterior)
            enviarCorreoConfirmacion(req.session.user.correo, datosDocumento, pdfBuffer);
        });

        // Construir PDF (Pasamos datosDocumento en lugar de un objeto suelto)
        buildInvoice(datosDocumento, pdfStream);

        // =========================================================
        // === FIN DE CAMBIOS ===
        // =========================================================

        // 5. Limpiar Carrito y Redirigir (Igual que antes)
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



    // (POST /pedido/api/validar-cupon)
pedidoController.validarCupon = async (req, res) => {
    const { codigo } = req.body;
    const cart = req.session.cart;

    if (!cart) return res.status(400).json({ error: 'Carrito vacío' });

    try {
        const cupon = await Descuento.validar(codigo); // Usamos la función que creamos antes

        if (!cupon) {
            return res.status(404).json({ error: 'Cupón inválido o expirado.' });
        }

        // Validar monto mínimo
        if (cart.total < cupon.monto_minimo) {
            return res.status(400).json({ 
                error: `Este cupón requiere una compra mínima de S/ ${cupon.monto_minimo}` 
            });
        }

        // Calcular descuento
        const descuento = (cart.total * cupon.porcentaje_descuento) / 100;
        const nuevoTotal = cart.total - descuento;

        res.json({
            success: true,
            mensaje: `¡Cupón aplicado! -${cupon.porcentaje_descuento}%`,
            descuento: descuento.toFixed(2),
            nuevoTotal: nuevoTotal.toFixed(2),
            id_descuento: cupon.id_descuento
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al validar cupón.' });
    }
};

module.exports = pedidoController;