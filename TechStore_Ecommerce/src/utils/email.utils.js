const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false,

    auth: {
        user: process.env.BREVO_USER,// Tu usuario de Brevo (Sendinblue)
        pass: process.env.BREVO_PASS// Tu contraseña de Brevo (Sendinblue)
    },

    tls: {
        rejectUnauthorized: false
    },

    connectionTimeout: 20000,
    greetingTimeout: 20000,
    socketTimeout: 20000
});


// Función para generar el HTML bonito
function generarHTMLPedido(pedido) {
    const filasProductos = pedido.items.map(item => `
        <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 12px; color: #333;">${item.nombre_producto}</td>
            <td style="padding: 12px; text-align: center; color: #333;">${item.cantidad}</td>
            <td style="padding: 12px; text-align: right; color: #333;">S/ ${parseFloat(item.precio).toFixed(2)}</td>
            <td style="padding: 12px; text-align: right; font-weight: bold; color: #333;">S/ ${(item.cantidad * item.precio).toFixed(2)}</td>
        </tr>
    `).join('');

    // Lógica para mostrar descuento solo si existe
    let filaDescuento = '';
    if (parseFloat(pedido.descuento) > 0) {
        filaDescuento = `
        <tr>
            <td colspan="3" style="padding: 8px 12px; text-align: right; color: #28a745;">Descuento Aplicado:</td>
            <td style="padding: 8px 12px; text-align: right; color: #28a745;">- S/ ${pedido.descuento}</td>
        </tr>`;
    }

    return `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f0f2f5; padding: 40px 0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
            
            <div style="background: linear-gradient(135deg, #6a0dad, #8A2BE2); padding: 30px; text-align: center; color: #ffffff;">
                <h1 style="margin: 0; font-size: 26px; font-weight: 700;">¡Gracias por tu compra!</h1>
                <p style="margin: 10px 0 0; opacity: 0.9; font-size: 16px;">Orden #${pedido.id_pedido}</p>
            </div>

            <div style="padding: 30px;">
                <p style="color: #555; font-size: 16px; line-height: 1.5;">Hola <strong>${pedido.nombre}</strong>,</p>
                <p style="color: #555; line-height: 1.5;">Tu pedido ha sido confirmado. Aquí tienes el detalle:</p>
                
                <table style="width: 100%; border-collapse: collapse; margin-top: 25px; font-size: 14px;">
                    <thead>
                        <tr style="background-color: #f8f9fa; text-align: left;">
                            <th style="padding: 12px; color: #666; font-weight: 600;">Producto</th>
                            <th style="padding: 12px; text-align: center; color: #666; font-weight: 600;">Cant.</th>
                            <th style="padding: 12px; text-align: right; color: #666; font-weight: 600;">P. Unit</th>
                            <th style="padding: 12px; text-align: right; color: #666; font-weight: 600;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filasProductos}
                    </tbody>
                    <tfoot style="background-color: #fcfcfc;">
                        <tr>
                            <td colspan="3" style="padding: 15px 12px 5px; text-align: right; color: #666;">Op. Gravada (Valor Venta):</td>
                            <td style="padding: 15px 12px 5px; text-align: right; color: #333;">S/ ${pedido.valor_venta}</td>
                        </tr>
                        <tr>
                            <td colspan="3" style="padding: 5px 12px; text-align: right; color: #666;">IGV (18%):</td>
                            <td style="padding: 5px 12px; text-align: right; color: #333;">S/ ${pedido.igv}</td>
                        </tr>
                        ${filaDescuento}
                        <tr>
                            <td colspan="3" style="padding: 5px 12px 15px; text-align: right; color: #666;">Envío:</td>
                            <td style="padding: 5px 12px 15px; text-align: right; color: #333;">Gratis</td>
                        </tr>
                        
                        <tr style="background-color: #eef2ff; border-top: 2px solid #6a0dad;">
                            <td colspan="3" style="padding: 15px 12px; text-align: right; font-weight: bold; color: #6a0dad; font-size: 18px;">TOTAL A PAGAR:</td>
                            <td style="padding: 15px 12px; text-align: right; font-weight: bold; color: #6a0dad; font-size: 18px;">S/ ${pedido.total}</td>
                        </tr>
                    </tfoot>
                </table>

                <div style="margin-top: 30px; border-left: 4px solid #6a0dad; padding-left: 15px;">
                    <p style="margin: 0; color: #333; font-weight: bold;">Datos de Facturación</p>
                    <p style="margin: 5px 0 0; color: #666; font-size: 13px;">
                        Tipo: ${pedido.tipo_comprobante}<br>
                        ${pedido.receiptType === 'Factura' ? `RUC: ${pedido.shipping.ruc}<br>Razón Social: ${pedido.shipping.company}` : `Cliente: ${pedido.nombre}`}
                    </p>
                </div>
            </div>
            
            <div style="background-color: #333; padding: 20px; text-align: center; color: #888; font-size: 12px;">
                <p style="margin: 0;">&copy; 2025 TechStore S.A.C.</p>
            </div>
        </div>
    </div>
    `;
}

async function enviarCorreoConfirmacion(destinatario, datosPedido, pdfBuffer) {
    const htmlContent = generarHTMLPedido(datosPedido); // Usamos la función generadora

    const mailOptions = {
      from: `"TechStore Ventas" <${process.env.EMAIL_USER}>`,
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
       console.error("❌ Error al enviar correo:", error.response || error);
    }
}

module.exports = { enviarCorreoConfirmacion };