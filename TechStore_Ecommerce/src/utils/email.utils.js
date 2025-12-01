// src/utils/email.utils.js
const brevo = require('@getbrevo/brevo');
require('dotenv').config();

// 1. Configuración de la API Key de Brevo
let apiInstance = new brevo.TransactionalEmailsApi();
let apiKey = apiInstance.authentications['apiKey'];
apiKey.apiKey = process.env.BREVO_API_KEY;

// 2. Función para generar el HTML (La misma que tenías, adaptada)
function generarHTMLPedido(pedido) {
    const filasProductos = pedido.items.map(item => `
        <tr style="background: #ffffff;">
            <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.nombre_producto}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.cantidad}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">S/ ${parseFloat(item.precio).toFixed(2)}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">S/ ${(item.cantidad * item.precio).toFixed(2)}</td>
        </tr>
    `).join('');

    return `
    <div style="font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px;">
        <div style="max-width: 650px; margin: auto; background: #ffffff; padding: 25px; border-radius: 8px; border-top: 5px solid #6a0dad;">
            <h2 style="color: #6a0dad; margin-bottom: 10px; text-align: center;">¡Gracias por tu compra, ${pedido.nombre}!</h2>
            <p style="font-size: 15px; text-align: center;">Tu pedido <strong>#${pedido.id_pedido}</strong> ha sido confirmado exitosamente.</p>
            
            <h3 style="margin-top: 25px; color: #333;">Detalles del Pedido:</h3>
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                <thead>
                    <tr style="background: #6a0dad; color: white;">
                        <th style="padding: 12px; text-align: left;">Producto</th>
                        <th style="padding: 12px; text-align: center;">Cant.</th>
                        <th style="padding: 12px; text-align: right;">Precio</th>
                        <th style="padding: 12px; text-align: right;">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    ${filasProductos}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="3" style="padding: 15px 12px; text-align: right; font-weight: bold;">TOTAL:</td>
                        <td style="padding: 15px 12px; text-align: right; font-weight: bold; color: #6a0dad;">S/ ${pedido.total}</td>
                    </tr>
                </tfoot>
            </table>
            
            <p style="margin-top: 20px; text-align: center;">📎 Se adjunta tu comprobante en formato PDF.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #888; text-align: center;">TechStore Perú - Líderes en Tecnología</p>
        </div>
    </div>
    `;
}

// 3. Función Principal de Envío
async function enviarCorreoConfirmacion(destinatario, datosPedido, pdfBuffer) {
    let sendSmtpEmail = new brevo.SendSmtpEmail();

    // Asunto y Remitente
    sendSmtpEmail.subject = `✅ Compra Exitosa - Pedido #${datosPedido.id_pedido}`;
    
    // ¡IMPORTANTE!: Este correo debe ser el mismo con el que creaste la cuenta en Brevo
    // o uno que hayas verificado en la sección "Senders & IPs" de Brevo.
    sendSmtpEmail.sender = { "name": "TechStore Ventas", "email": "sistemaventa402@gmail.com" }; 
    
    // Destinatario
    sendSmtpEmail.to = [{ "email": destinatario, "name": datosPedido.nombre }];
    
    // Contenido HTML
    sendSmtpEmail.htmlContent = generarHTMLPedido(datosPedido);

    // Adjunto (PDF)
    // Brevo requiere el contenido en base64
    if (pdfBuffer) {
        sendSmtpEmail.attachment = [
            {
                "content": pdfBuffer.toString('base64'),
                "name": `Comprobante_${datosPedido.id_pedido}.pdf`
            }
        ];
    }

    try {
        const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log('✅ Correo enviado con éxito. ID:', data.messageId);
        return true;
    } catch (error) {
        console.error('❌ Error API Brevo:', error);
        // Si el error es detallado, lo mostramos
        if (error.response && error.response.body) {
            console.error('Detalle Error Brevo:', error.response.body);
        }
        return false;
    }
}

module.exports = { enviarCorreoConfirmacion };