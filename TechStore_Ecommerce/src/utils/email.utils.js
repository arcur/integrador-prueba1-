const nodemailer = require('nodemailer');

// Usamos el servicio 'gmail' predefinido para evitar líos de puertos
const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false // Ignora errores de certificado en la nube
    }
});

// Función para generar el HTML del correo
function generarHTMLPedido(pedido) {
    const filasProductos = pedido.items.map(item => `
        <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 12px; color: #333;">${item.nombre_producto}</td>
            <td style="padding: 12px; text-align: center; color: #333;">${item.cantidad}</td>
            <td style="padding: 12px; text-align: right; color: #333;">S/ ${parseFloat(item.precio).toFixed(2)}</td>
            <td style="padding: 12px; text-align: right; font-weight: bold; color: #333;">S/ ${(item.cantidad * item.precio).toFixed(2)}</td>
        </tr>
    `).join('');

    let filaDescuento = '';
    if (parseFloat(pedido.descuento) > 0) {
        filaDescuento = `
        <tr>
            <td colspan="3" style="padding: 8px 12px; text-align: right; color: #28a745;">Descuento Aplicado:</td>
            <td style="padding: 8px 12px; text-align: right; color: #28a745;">- S/ ${pedido.descuento}</td>
        </tr>`;
    }

    return `
    <div style="font-family: Arial, sans-serif; background-color: #f0f2f5; padding: 40px 0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px;">
            <h2 style="color: #6a0dad; text-align: center;">¡Gracias por tu compra!</h2>
            <p>Hola <strong>${pedido.nombre}</strong>, tu pedido <strong>#${pedido.id_pedido}</strong> ha sido confirmado.</p>
            
            <table style="width: 100%; margin-top: 20px; border-collapse: collapse;">
                <thead style="background-color: #f8f9fa;">
                    <tr>
                        <th style="padding: 10px; text-align: left;">Producto</th>
                        <th style="padding: 10px; text-align: center;">Cant.</th>
                        <th style="padding: 10px; text-align: right;">P. Unit</th>
                        <th style="padding: 10px; text-align: right;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${filasProductos}
                </tbody>
                <tfoot>
                    ${filaDescuento}
                    <tr>
                        <td colspan="3" style="padding: 15px 10px; text-align: right; font-weight: bold;">TOTAL:</td>
                        <td style="padding: 15px 10px; text-align: right; font-weight: bold; color: #6a0dad;">S/ ${pedido.total}</td>
                    </tr>
                </tfoot>
            </table>
        </div>
    </div>`;
}

async function enviarCorreoConfirmacion(destinatario, datosPedido, pdfBuffer) {
    const htmlContent = generarHTMLPedido(datosPedido);

    const mailOptions = {
        from: '"TechStore Ventas" <' + process.env.EMAIL_USER + '>',
        to: destinatario,
        subject: `✅ Pedido Confirmado #${datosPedido.id_pedido}`,
        html: htmlContent,
        attachments: [
            {
                filename: `Comprobante_${datosPedido.id_pedido}.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf'
            }
        ]
    };

    try {
        console.log(`Intentando enviar correo a ${destinatario}...`);
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Correo enviado: ${info.messageId}`);
    } catch (error) {
        console.error('❌ Error al enviar correo:', error.message);
    }
}

module.exports = { enviarCorreoConfirmacion };