const fs = require("fs");
const PDFDocument = require("pdfkit");
const moment = require("moment");
const path = require("path");

const createInvoicePDF = async (invoice, directoryPath, fileName) => {
  const fullPath = path.join(directoryPath, fileName);
  const stream = fs.createWriteStream(fullPath);

  const doc = new PDFDocument({ size: "A4", margin: 50 });

  generateHeader(doc);
  generateCustomerInformation(doc, invoice);
  generateInvoiceTable(doc, invoice);
  generateFooter(doc);

  doc.end();
  doc.pipe(stream);

  return doc;

  // return new Promise((resolve, reject) => {
  //   stream.on("finish", () => {
  //     resolve(fullPath);
  //   });
  //   doc.on("error", (err) => {
  //     reject(err);
  //   });
  // });
};

function generateHeader(doc) {
  doc
    .text("Garasi Jogja")
    .fillColor("#444444")
    .fontSize(20)
    .fontSize(10)
    .text("Garasi Jogja.", 200, 50, { align: "right" })
    .text("Jalan Beringin", 200, 65, { align: "right" })
    .text("Pamulang, Tangerang Selatan, 15417", 200, 80, { align: "right" })
    .moveDown();
}

function generateCustomerInformation(doc, invoice) {
  doc.fillColor("#444444").fontSize(20).text("Invoice", 50, 160);

  generateHr(doc, 185);

  const customerInformationTop = 200;

  doc
    .fontSize(10)
    .text("Invoice Number:", 50, customerInformationTop)
    .font("Helvetica-Bold")
    .text(invoice.bookingNumber, 150, customerInformationTop)
    .font("Helvetica")
    .text("Invoice Date:", 50, customerInformationTop + 15)
    .text(formatDate(invoice.chooseDate), 150, customerInformationTop + 15)

    .font("Helvetica-Bold")
    .text(invoice.userId.name, 300, customerInformationTop)
    .font("Helvetica")
    .text(invoice.userId.phoneNumber, 300, customerInformationTop + 15)
    .moveDown();

  generateHr(doc, 252);
}

function generateInvoiceTable(doc, invoice) {
  let i;
  const invoiceTableTop = 330;

  doc.font("Helvetica-Bold");
  generateTableRow(
    doc,
    invoiceTableTop,
    "Item",
    "Unit Cost",
    "Quantity",
    "Line Total"
  );
  generateHr(doc, invoiceTableTop + 20);
  doc.font("Helvetica");

  for (i = 0; i < invoice.spareparts.length; i++) {
    const item = invoice.spareparts[i];
    const position = invoiceTableTop + (i + 1) * 30;
    generateTableRow(
      doc,
      position,
      item.sparepartId.name,
      formatCurrency(item.sparepartId.price),
      item.quantity,
      formatCurrency(item.sparepartId.price * item.quantity)
    );

    generateHr(doc, position + 20);
  }

  const subtotalPosition = invoiceTableTop + (i + 1) * 30;
  generateTableRow(
    doc,
    subtotalPosition,
    invoice.category.name,
    "",
    "",
    formatCurrency(invoice.category.price)
  );
  generateHr(doc, subtotalPosition + 20);
  doc.font("Helvetica-Bold");

  generateTableRow(
    doc,
    subtotalPosition + 30,
    "",
    "",
    "Subtotal",
    formatCurrency(parseInt(invoice?.total) ?? 0)
  );
}

function generateFooter(doc) {
  doc
    .fontSize(10)
    .text(
      "Payment is due within 15 days. Thank you for your business.",
      50,
      780,
      { align: "center", width: 500 }
    );
}

function generateTableRow(doc, y, item, unitCost, quantity, lineTotal) {
  doc
    .fontSize(10)
    .text(item, 50, y)
    .text(unitCost, 280, y, { width: 90, align: "right" })
    .text(quantity, 370, y, { width: 90, align: "right" })
    .text(lineTotal, 0, y, { align: "right" });
}

function generateHr(doc, y) {
  doc.strokeColor("#aaaaaa").lineWidth(1).moveTo(50, y).lineTo(550, y).stroke();
}

function formatCurrency(cents) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
  }).format(cents);
}

function formatDate(date) {
  return moment(date).format("DD MMMM YYYY");
}

module.exports = {
  createInvoicePDF,
};
