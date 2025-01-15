import { formatCurrency } from "../../formatters/formatcurrency";
import { dateFormatBe } from "../../formatters/dateformatters";
import { flexBox, PageSize } from "../common/positioning";
import { addDaysToDate } from "../../addtodate";
import { pdfHead } from "../common/pdfhead";
import { Buffer } from "buffer";

export async function generateInvoiceOut({
  document,
  logoBuffer,
}: {
  document: any;
  logoBuffer?: Buffer;
}): Promise<{ filename: string; content: Buffer; contentType: string }> {
  const invoiceDoc = document;
  const establishment = invoiceDoc.establishment;
  const establishmentAddress = establishment.address;
  const customer = invoiceDoc.customer;
  const documentProducts = invoiceDoc.products;
  const payments = invoiceDoc.payments;

  return new Promise(async (resolve, reject) => {
    const pageLeft = 0;
    const pageTop = 40;
    const pageSize: PageSize = "A4";
    try {
      const PDFDocument: PDFKit.PDFDocument = require("pdfkit");
      const doc = new PDFDocument({ size: pageSize, margin: 20 });
      const buffers: Uint8Array[] = [];

      doc.on("data", buffers.push.bind(buffers));

      await pdfHead({
        doc,
        invoiceDoc,
        logoBuffer,
        pageLeft,
        pageTop,
      });

      const columns = [50, 100, 150, 200, 250, 300, 350, 400, 450, 500];

      const generateTableRow = (
        doc: any,
        y: number,
        name: string,
        description: string,
        price: string,
        amount: string,
        tax: string,
        subtotal: string,
        isHeader = false
      ) => {
        const nameBox = flexBox({ pageSize: "A4", originY: y, flex: 3, column: 1, columnCount: 10 });
        if (isHeader) {
          doc.lineWidth(15);
          const bgY = y + 5;
          doc.lineCap("butt").moveTo(20, bgY).lineTo(575, bgY).stroke("black");
          doc
            .fontSize(10)
            .fillColor("white")
            .text(name, nameBox.x + 30, nameBox.y, { width: nameBox.width - 30, align: "left" })
            .text(description, columns[4], y)
            .text(price, columns[6], y)
            .text(amount, columns[7], y)
            .text(tax, columns[8], y)
            .text(subtotal, columns[9], y);
        } else {
          doc
            .fontSize(9)
            .fillColor("black")
            .text(name, nameBox.x + 30, nameBox.y, { width: nameBox.width - 30, align: "left" })
            .text(description, columns[4], y)
            .text(price, columns[6], y)
            .text(amount, columns[7] + 20, y)
            .text(tax, columns[8], y)
            .text(subtotal, columns[9], y);
        }
      };

      const generateInvoiceTable = (doc: any, documentProducts: any[], y: number) => {
        let invoiceTableTop = y;
        generateTableRow(doc, invoiceTableTop + 15, "Name", "Description", "Price", "Amount", "Tax", "Subtotal", true);
        for (let i = 1; i <= documentProducts.length; i++) {
          const item = documentProducts[i - 1];
          const position = invoiceTableTop + i * 40;
          generateTableRow(
            doc,
            position,
            item.name,
            item.description,
            formatCurrency(Number(item.price)),
            item.amount,
            formatCurrency(Number(item.totalTax)),
            formatCurrency(Number(item.totalWithTaxAfterReduction))
          );
        }
        return invoiceTableTop + (documentProducts.length + 1) * 40;
      };

      const bankDetails = ({ doc, x, y, establishment }: { doc: any; x: number; y: number; establishment: any }) => {
        let strings = [];
        if (establishment.bankAccount1) {
          strings.push(establishment.bankAccount1);
        }
        if (establishment.bankAccount2 !== null) {
          strings.push(establishment.bankAccount2);
        }
        if (establishment.bankAccount3 !== null) {
          strings.push(establishment.bankAccount3);
        }
        strings.map((string, index) => {
          doc.text(string, x, y + index * 15);
        });
      };

      const customerDetails = ({ doc, x, y, invoiceDoc }: { doc: any; x: number; y: number; invoiceDoc: any }) => {
        let strings = [];
        const docAddress = invoiceDoc.delAddress;

        if (customer.customerCompany) {
          strings.push(customer.customerCompany);
        }

        if (customer.customerTaxNumber) {
          strings.push(customer.customerTaxNumber);
        }

        if (customer.phone) {
          strings.push(customer.phone);
        }

        strings.push(docAddress.street + " " + docAddress.door);
        if (docAddress.floor) {
          strings.push("floor: " + docAddress.floor);
        }
        strings.push(docAddress.zip + " " + docAddress.city + " " + docAddress.country);

        strings.map((string, index) => {
          doc.text(string, x, y + index * 15);
        });
        return y + strings.length * 15;
      };

      const paymentsTable = ({ doc, x, y, payments }: { doc: any; x: number; y: number; payments: any[] }) => {
        doc
          .lineCap("butt")
          .moveTo(x, y)
          .lineTo(x + 230, y)
          .stroke("black");

        doc.fillColor("white").text("Payment History:", x + 10, y - 5);

        doc.fillColor("black");

        payments.forEach((payment, i) => {
          doc.text(dateFormatBe(payment.timestamp), x + 10, y + 20 * (i + 1));
          doc.text(payment.type, x + 85, y + 20 * (i + 1));
          doc.text(formatCurrency(Number(payment.value)), x + 150, y + 20 * (i + 1), {
            width: 80,
            align: "right",
          });
        });
      };

      const taxTable = ({ doc, x, y, documentProducts }: { doc: any; x: number; y: number; documentProducts: any[] }) => {
        let taxRates: number[] = [];

        documentProducts.forEach((docProd, i) => {
          if (!taxRates.includes(docProd.tax)) {
            taxRates.push(docProd.tax);
          }
        });

        taxRates = taxRates.sort((a, b) => a - b);

        doc.fontSize(10).text("Total Tax:", x, y + 50);
        doc.text(formatCurrency(Number(document.totalTax)));

        taxRates.map((taxRate, index) => {
          doc
            .text("Total Tax " + taxRate + "%:", x, y + 50 + (index + 1) * 15)
            .text(
              formatCurrency(documentProducts.filter((dp) => dp.tax === taxRate).reduce((acc, dp) => acc + Number(dp.totalTax), 0)),
              x + 80,
              y + 50 + (index + 1) * 15
            );
        });

        return y + taxRates.length * 15 + 50;
      };

      let y = 140;

      doc.text(establishment.name, 50, y);
      doc.text(establishment.taxID, 50, y + 15);
      bankDetails({
        doc: doc,
        x: 50,
        y: y + 30,
        establishment: establishment,
      });

      doc.text(establishmentAddress.street + " " + establishmentAddress.door, 200, y);
      doc.text(establishmentAddress.zip + " " + establishmentAddress.city, 200, y + 15);
      doc.text(establishment.phone, 200, y + 30);
      doc.text(establishment.phone2, 200, y + 45);

      doc.text("Order: " + invoiceDoc.references, 380, y);
      doc.text(customer.firstName + " " + customer.lastName, 380, y + 15);
      y = customerDetails({
        doc: doc,
        x: 380,
        y: y + 30,
        invoiceDoc: invoiceDoc,
      });

      y += 60;

      y = generateInvoiceTable(doc, documentProducts, y);

      if (y < 500) {
        y = 500;
      }

      taxTable({
        doc: doc,
        x: 30,
        y: y,
        documentProducts: documentProducts,
      });

      paymentsTable({ doc: doc, x: 170, y: y + 30, payments: payments });

      let totalsX = 410;
      doc.text("Total Excl. Tax:", totalsX, y + 50);
      doc.text(formatCurrency(Number(invoiceDoc.total) - Number(invoiceDoc.totalTax)));
      doc.text("Total:", totalsX, y + 65);
      doc.text(formatCurrency(Number(invoiceDoc.total)), totalsX + 70, y + 65);
      doc.text("Already Paid:", totalsX, y + 80);
      doc.text(formatCurrency(Number(invoiceDoc.totalPaid)), totalsX + 70, y + 80);
      doc.text("To Pay:", totalsX, y + 95);
      doc.text(formatCurrency(Number(invoiceDoc.totalToPay)), totalsX + 70, y + 95);

      doc.end();
      doc.on("end", () => {
        const pdfData = Buffer.concat(buffers);
        resolve({
          filename: `invoice_${document.number}.pdf`,
          content: pdfData,
          contentType: "application/pdf",
        });
      });
    } catch (error) {
      console.error("error on pdf generation (invoice): ", error);
      reject(`Error generating invoice: ${error}`);
    }
  });
}
