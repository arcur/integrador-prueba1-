import SibApiV3Sdk from 'sib-api-v3-sdk';

// ===============================
// CONFIGURACIÓN BREVO API
// ===============================
const client = SibApiV3Sdk.ApiClient.instance;
client.authentications['api-key'].apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();


// ===============================
// HTML ESTÉTICO PARA EL CORREO
// ===============================
function generarHTMLPedido(pedido) {

    const filasProductos = pedido.items.map(item => `
        <tr style="background: #ffffff;">
            <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.nombre_producto}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.cantidad}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">S/ ${item.precio}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">S/ ${(item.cantidad * item.precio).toFixed(2)}</td>
        </tr>
    `).join('');

    return `
    <div style="font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px;">
        <div style="max-width: 650px; margin: auto; background: #ffffff; padding: 25px; border-radius: 8px;">
            <h2 style="color: #2d89ef; margin-bottom: 10px;">
                ¡Gracias por tu compra, ${pedido.nombre}!
            </h2>

            <p style="font-size: 15px;">
                Tu pedido <strong>#${pedido.id_pedido}</strong> ha sido confirmado exitosamente.
            </p>

            <h3 style="margin-top: 25px;">Detalles del Pedido:</h3>

            <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                <thead>
                    <tr style="background: #2d89ef; color: white;">
                        <th style="padding: 12px;">Producto</th>
                        <th style="padding: 12px; text-align: center;">Cantidad</th>
                        <th style="padding: 12px; text-align: right;">Precio</th>
                        <th style="padding: 12px; text-align: right;">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    ${filasProductos}
                </tbody>
            </table>

            <p style="margin-top: 25px; font-size: 16px;">
                <strong>Total pagado: S/ ${pedido.total}</strong>
            </p>

            <p style="margin-top: 20px;">
                Se adjunta tu comprobante en formato PDF.
            </p>

            <p style="font-size: 13px; color: #888; margin-top: 30px;">
                Este es un mensaje automático, por favor no responder.
            </p>
        </div>
    </div>
    `;
}


// ===============================
// ENVÍO DE CORREO CON PDF
// ===============================
export async function enviarCorreoConfirmacion(destinatario, datosPedido, pdfBuffer) {
    try {
        const email = {
            sender: { 
                name: "TechStore", 
                email: "no-reply@techstore.com" 
            },

            to: [{ email: destinatario }],

            subject: `🧾 Comprobante de Pago - Pedido #${datosPedido.id_pedido}`,

            htmlContent: generarHTMLPedido(datosPedido),

            attachment: [
                {
                    name: `Comprobante_${datosPedido.id_pedido}.pdf`,
                    content: pdfBuffer.toString("base64")
                }
            ]
        };

        const response = await apiInstance.sendTransacEmail(email);
        console.log("📧 Correo enviado correctamente:", response.messageId);

        return true;

    } catch (error) {
        console.error("❌ Error al enviar correo:", error);
        return false;
    }
}
