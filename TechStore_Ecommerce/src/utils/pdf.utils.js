const PDFDocument = require('pdfkit');

function buildInvoice(invoice, stream) {
    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(stream);

    // --- Cabecera ---
    doc.fillColor('#444444').fontSize(20).text('TechStore S.A.C.', 50, 57)
       .fontSize(10).text('Av. La Innovación 101, Lima', 200, 65, { align: 'right' })
       .text('RUC: 20123456789', 200, 80, { align: 'right' }).moveDown();

    // --- Datos ---
    doc.fillColor('#000000').fontSize(12).text('Comprobante de Pago Electrónico', 50, 120);
    doc.fontSize(10)
       .text(`Pedido: #${invoice.id_pedido}`, 50, 140)
       .text(`Fecha: ${new Date().toLocaleDateString()}`, 50, 155)
       .text(`Cliente: ${invoice.shipping.name}`, 300, 140, { align: 'right' })
       .text(`Tipo: ${invoice.tipo_comprobante.toUpperCase()}`, 300, 155, { align: 'right' });

    if (invoice.receiptType === 'Factura') {
        doc.text(`RUC: ${invoice.shipping.ruc}`, 300, 170, { align: 'right' })
           .text(`Razón Soc.: ${invoice.shipping.company}`, 300, 185, { align: 'right' });
    }

    // --- Tabla ---
    const invoiceTableTop = 230;
    doc.font("Helvetica-Bold");
    generateTableRow(doc, invoiceTableTop, "Item", "Cant.", "P. Unit", "Total");
    generateHr(doc, invoiceTableTop + 20);
    doc.font("Helvetica");

    let position = 0;
    invoice.items.forEach((item, index) => {
        position = invoiceTableTop + (index + 1) * 30;
        generateTableRow(doc, position,
            item.nombre_producto.substring(0, 30),
            item.cantidad,
            `S/ ${parseFloat(item.precio).toFixed(2)}`,
            `S/ ${(item.cantidad * item.precio).toFixed(2)}`
        );
        generateHr(doc, position + 20);
    });

    // --- Totales (DESGLOSE) ---
    const subtotalPosition = position + 40;
    
    // 1. Op. Gravada (Valor Venta)
    doc.font("Helvetica").text("Op. Gravada:", 350, subtotalPosition)
       .text(`S/ ${invoice.valor_venta}`, 450, subtotalPosition, { align: "right" });
    
    // 2. IGV
    doc.text("IGV (18%):", 350, subtotalPosition + 15)
       .text(`S/ ${invoice.igv}`, 450, subtotalPosition + 15, { align: "right" });

    // 3. Descuento (si hay)
    let finalPos = subtotalPosition + 30;
    if (parseFloat(invoice.descuento) > 0) {
        doc.fillColor("#28a745").text("Descuento:", 350, finalPos)
           .text(`- S/ ${invoice.descuento}`, 450, finalPos, { align: "right" });
        doc.fillColor("#000000");
        finalPos += 15;
    }

    // 4. TOTAL
    doc.font("Helvetica-Bold").fontSize(12)
       .text("TOTAL A PAGAR:", 300, finalPos + 10)
       .text(`S/ ${invoice.total}`, 450, finalPos + 10, { align: "right" });

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