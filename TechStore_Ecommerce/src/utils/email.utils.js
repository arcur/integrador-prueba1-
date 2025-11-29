const nodemailer = require('nodemailer');

// Asegúrate de que .env tenga EMAIL_USER y EMAIL_PASS
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Función para generar el HTML bonito
function generarHTMLPedido(pedido) {
    const filasProductos = pedido.items.map(item => `
        <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 10px; color: #333;">${item.nombre_producto}</td>
            <td style="padding: 10px; text-align: center; color: #333;">${item.cantidad}</td>
            <td style="padding: 10px; text-align: right; color: #333;">S/ ${parseFloat(item.precio).toFixed(2)}</td>
            <td style="padding: 10px; text-align: right; font-weight: bold; color: #333;">S/ ${(item.cantidad * item.precio).toFixed(2)}</td>
        </tr>
    `).join('');

    return `
    <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
            
            <div style="background-color: #6a0dad; padding: 20px; text-align: center; color: #ffffff;">
                <h1 style="margin: 0; font-size: 24px;">¡Gracias por tu compra!</h1>
                <p style="margin: 5px 0 0; opacity: 0.9;">Orden #${pedido.id_pedido}</p>
            </div>

            <div style="padding: 30px;">
                <p style="color: #555; font-size: 16px;">Hola <strong>${pedido.nombre}</strong>,</p>
                <p style="color: #555;">Hemos recibido tu pedido correctamente. Estamos preparándolo para el envío.</p>
                
                <h3 style="color: #6a0dad; border-bottom: 2px solid #6a0dad; padding-bottom: 5px; margin-top: 30px;">Resumen del Pedido</h3>
                
                <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                    <thead>
                        <tr style="background-color: #f8f9fa; text-align: left;">
                            <th style="padding: 10px; color: #666;">Producto</th>
                            <th style="padding: 10px; text-align: center; color: #666;">Cant.</th>
                            <th style="padding: 10px; text-align: right; color: #666;">Precio</th>
                            <th style="padding: 10px; text-align: right; color: #666;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filasProductos}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="3" style="padding: 15px 10px; text-align: right; color: #666;">Envío:</td>
                            <td style="padding: 15px 10px; text-align: right; color: #333;">Gratis</td>
                        </tr>
                        <tr style="background-color: #f4f4f4;">
                            <td colspan="3" style="padding: 15px 10px; text-align: right; font-weight: bold; color: #333; font-size: 18px;">Total Pagado:</td>
                            <td style="padding: 15px 10px; text-align: right; font-weight: bold; color: #28a745; font-size: 18px;">S/ ${pedido.total}</td>
                        </tr>
                    </tfoot>
                </table>

                <div style="margin-top: 30px; background-color: #eef2ff; padding: 15px; border-radius: 5px;">
                    <p style="margin: 0; color: #6a0dad; font-size: 14px;"><strong>Tipo de Comprobante:</strong> ${pedido.tipo_comprobante}</p>
                    <p style="margin: 5px 0 0; color: #666; font-size: 13px;">Adjunto encontrarás el documento PDF.</p>
                </div>
            </div>

            <div style="background-color: #333; padding: 20px; text-align: center; color: #999; font-size: 12px;">
                <p style="margin: 0;">&copy; 2025 TechStore S.A.C. Todos los derechos reservados.</p>
                <p style="margin: 5px 0;">Av. La Innovación 101, Lima, Perú</p>
            </div>
        </div>
    </div>
    `;
}

async function enviarCorreoConfirmacion(destinatario, datosPedido, pdfBuffer) {
    const htmlContent = generarHTMLPedido(datosPedido); // Usamos la función generadora

    const mailOptions = {
        from: '"TechStore Ventas" <no-reply@techstore.com>', // Nombre personalizado
        to: destinatario,
        subject: `✅ Pedido Confirmado #${datosPedido.id_pedido} - TechStore`, // Icono en asunto
        html: htmlContent, // HTML enriquecido
        attachments: [
            {
                filename: `Comprobante_${datosPedido.id_pedido}.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf'
            }
        ]
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`📧 Correo enviado a: ${destinatario}`);
    } catch (error) {
        console.error('❌ Error al enviar correo:', error);
    }
}

module.exports = { enviarCorreoConfirmacion };