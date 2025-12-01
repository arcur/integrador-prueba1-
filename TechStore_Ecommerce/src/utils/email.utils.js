// src/utils/email.utils.js
const brevo = require('@getbrevo/brevo');
require('dotenv').config();

// =======================================================
// 1. CONFIGURACIÓN DE LA API KEY DE BREVO
// =======================================================
let apiInstance = new brevo.TransactionalEmailsApi();
let apiKey = apiInstance.authentications['apiKey'];
apiKey.apiKey = process.env.BREVO_API_KEY;


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

async function enviarCorreoConfirmacion(destinatario, datosPedido, pdfBuffer) {
    let sendSmtpEmail = new brevo.SendSmtpEmail();

    sendSmtpEmail.subject = `✅ Compra Exitosa - Pedido #${datosPedido.id_pedido}`;
    // Asegúrate de que este correo esté verificado en Brevo
    sendSmtpEmail.sender = { "name": "TechStore Ventas", "email": "sistemaventa402@gmail.com" }; 
    sendSmtpEmail.to = [{ "email": destinatario, "name": datosPedido.nombre }];
    sendSmtpEmail.htmlContent = generarHTMLPedido(datosPedido);

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
        console.log('✅ Correo de confirmación enviado. ID:', data.messageId);
        return true;
    } catch (error) {
        console.error('❌ Error API Brevo (Confirmación):', error);
        return false;
    }
}


// =======================================================
// 3. NUEVAS FUNCIONES PARA CAMBIOS DE ESTADO
// =======================================================


function htmlEnCamino(pedido) {
    return `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f7f6; padding: 40px 0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
            <div style="background: linear-gradient(135deg, #00c6ff, #0072ff); padding: 40px 20px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">¡Tu pedido está en camino! 🚚</h1>
                <p style="color: rgba(255,255,255,0.9); font-size: 16px; margin-top: 10px;">Orden #${pedido.id_pedido}</p>
            </div>
            <div style="padding: 40px 30px;">
                <p style="color: #555; font-size: 16px; line-height: 1.6;">Hola <strong>${pedido.nombre}</strong>,</p>
                <p style="color: #555; font-size: 16px; line-height: 1.6;">
                    Buenas noticias. Hemos empaquetado tus productos y el courier ya los tiene. 
                    Pronto llegarán a la dirección que nos indicaste.
                </p>
                <div style="background-color: #f8f9fa; border-left: 4px solid #0072ff; padding: 15px; margin: 25px 0;">
                    <p style="margin: 0; color: #333; font-weight: bold;">Dirección de envío:</p>
                    <p style="margin: 5px 0 0; color: #666;">${pedido.direccion_entrega || 'Dirección registrada en tu cuenta'}</p>
                </div>
                <div style="text-align: center; margin-top: 30px;">
                    <a href="https://techstore-peru.onrender.com/intranet/mis_pedidos" style="background-color: #0072ff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 14px;">Ver Estado del Pedido</a>
                </div>
            </div>
            <div style="background-color: #f4f7f6; padding: 20px; text-align: center; color: #999; font-size: 12px;">
                <p>TechStore Perú - Líderes en Tecnología</p>
            </div>
        </div>
    </div>`;
}

// --- Plantilla: Pedido Entregado ---
function htmlEntregado(pedido) {
    return `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f7f6; padding: 40px 0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
            <div style="background: linear-gradient(135deg, #11998e, #38ef7d); padding: 40px 20px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">¡Pedido Entregado! 🎉</h1>
                <p style="color: rgba(255,255,255,0.9); font-size: 16px; margin-top: 10px;">Orden #${pedido.id_pedido}</p>
            </div>
            <div style="padding: 40px 30px; text-align: center;">
                <p style="color: #333; font-size: 18px; margin-bottom: 20px;">Hola <strong>${pedido.nombre}</strong>,</p>
                <p style="color: #555; font-size: 16px; line-height: 1.6;">
                    Esperamos que disfrutes tu compra. Gracias por confiar en <strong>TechStore</strong> para equipar tu setup.
                </p>
                <div style="margin: 30px 0;">
                    <img src="https://cdn-icons-png.flaticon.com/512/411/411712.png" alt="Happy" style="width: 80px; opacity: 0.8;">
                </div>
                <p style="color: #555; font-size: 16px; line-height: 1.6;">
                    ¿Te gustó tu producto? ¡No olvides dejarnos una reseña o compartirlo en redes!
                </p>
                <div style="text-align: center; margin-top: 30px;">
                    <a href="https://techstore-peru.onrender.com/catalogo" style="background-color: #333; color: white; padding: 12px 25px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 14px;">Volver a la Tienda</a>
                </div>
            </div>
            <div style="background-color: #f4f7f6; padding: 20px; text-align: center; color: #999; font-size: 12px;">
                <p>Gracias por tu preferencia ❤️ - TechStore Perú</p>
            </div>
        </div>
    </div>`;
}

// --- Función Principal para Enviar Estados (Enviado / Entregado) ---
async function enviarCorreoEstado(datosPedido, estado) {
    let sendSmtpEmail = new brevo.SendSmtpEmail();
    
    // Usamos el mismo remitente verificado
    sendSmtpEmail.sender = { "name": "TechStore Alertas", "email": "sistemaventa402@gmail.com" }; 
    sendSmtpEmail.to = [{ "email": datosPedido.correo, "name": datosPedido.nombre }];

    if (estado === 'Enviado') {
        sendSmtpEmail.subject = `🚚 Tu pedido #${datosPedido.id_pedido} está en camino`;
        sendSmtpEmail.htmlContent = htmlEnCamino(datosPedido);
    } else if (estado === 'Entregado') {
        sendSmtpEmail.subject = `✅ Tu pedido #${datosPedido.id_pedido} ha sido entregado`;
        sendSmtpEmail.htmlContent = htmlEntregado(datosPedido);
    } else {
        return; // Si es otro estado (ej: Pendiente), no enviamos correo.
    }

    try {
        const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log(`📧 Alerta de estado '${estado}' enviada a ${datosPedido.correo}. ID: ${data.messageId}`);
    } catch (error) {
        console.error('❌ Error API Brevo (Estado):', error);
    }
}

// Exportamos AMBAS funciones para usarlas en los controladores
module.exports = { enviarCorreoConfirmacion, enviarCorreoEstado };