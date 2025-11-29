// src/utils/pdf.utils.js
const PDFDocument = require('pdfkit');

function buildInvoice(invoice, stream) {
    const doc = new PDFDocument({ margin: 50 });

    doc.pipe(stream);

    // --- Cabecera ---
    doc.fillColor('#444444')
       .fontSize(20)
       .text('TechStore S.A.C.', 50, 57)
       .fontSize(10)
       .text('Av. La Innovación 101, Lima', 200, 65, { align: 'right' })
       .text('RUC: 20123456789', 200, 80, { align: 'right' })
       .moveDown();

    // --- Datos del Cliente ---
    doc.fillColor('#000000').fontSize(12).text('Comprobante de Pago', 50, 120);
    doc.fontSize(10)
       .text(`Nro. Pedido: #${invoice.orderId}`, 50, 140)
       .text(`Fecha: ${new Date().toLocaleDateString()}`, 50, 155)
       .text(`Cliente: ${invoice.shipping.name}`, 300, 140, { align: 'right' })
       .text(`Tipo: ${invoice.receiptType.toUpperCase()}`, 300, 155, { align: 'right' });

    if (invoice.receiptType === 'Factura') {
        doc.text(`RUC: ${invoice.shipping.ruc}`, 300, 170, { align: 'right' })
           .text(`Razón Social: ${invoice.shipping.company}`, 300, 185, { align: 'right' });
    }

    // --- Tabla de Productos ---
    let i;
    const invoiceTableTop = 230;
    doc.font("Helvetica-Bold");
    generateTableRow(doc, invoiceTableTop, "Item", "Cant.", "Precio Unit.", "Total");
    generateHr(doc, invoiceTableTop + 20);
    doc.font("Helvetica");

    let position = 0;
    invoice.items.forEach((item, index) => {
        position = invoiceTableTop + (index + 1) * 30;
        generateTableRow(doc, position,
            item.nombre_producto.substring(0, 30), // Cortar nombre largo
            item.cantidad,
            `S/ ${parseFloat(item.precio).toFixed(2)}`,
            `S/ ${(item.cantidad * item.precio).toFixed(2)}`
        );
        generateHr(doc, position + 20);
    });

    // --- Totales ---
    const subtotalPosition = position + 30;
    doc.font("Helvetica-Bold");
    generateTableRow(doc, subtotalPosition, "", "", "Total a Pagar:", `S/ ${invoice.total.toFixed(2)}`);

    // --- Pie de Página ---
    doc.fontSize(10).text(
        'Gracias por comprar en TechStore. Este documento es una representación impresa.',
        50,
        700,
        { align: 'center', width: 500 }
    );

    doc.end();
}

function generateTableRow(doc, y, item, quantity, unitCost, lineTotal) {
    doc.fontSize(10)
       .text(item, 50, y)
       .text(quantity, 280, y, { width: 90, align: "right" })
       .text(unitCost, 370, y, { width: 90, align: "right" })
       .text(lineTotal, 0, y, { align: "right" });
}

function generateHr(doc, y) {
    doc.strokeColor("#aaaaaa").lineWidth(1).moveTo(50, y).lineTo(550, y).stroke();
}

module.exports = { buildInvoice };