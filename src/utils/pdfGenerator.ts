import { jsPDF } from "jspdf";
import { Invoice, BusinessProfile } from "../types";
import { formatCurrency, formatDate } from "./formatters";

export function generateInvoicePdf(invoice: Invoice, business: BusinessProfile, isArabic: boolean = false) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const primaryColor = [16, 185, 129]; // Emerald 500
  const darkColor = [24, 24, 27]; // Zinc 900
  const grayColor = [113, 113, 122]; // Zinc 500

  // Brand Header
  doc.setFillColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.rect(0, 0, 210, 32, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("HASEBHA", 15, 18);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(16, 185, 129);
  doc.text("FINANCIAL INVOICE & TAX DOCUMENT", 15, 25);

  // Invoice Number & Status in Header Right
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(invoice.invoiceNumber, 195, 16, { align: "right" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const statusStr = invoice.status.toUpperCase();
  doc.text(`STATUS: ${statusStr}`, 195, 24, { align: "right" });

  // Two column details: Issuer (From) vs Client (Bill To)
  let y = 45;

  // FROM
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("ISSUED BY / FROM:", 15, y);

  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(business.businessName, 15, y + 6);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  doc.text(`Tax ID: ${business.taxNumber}`, 15, y + 11);
  doc.text(`Phone: ${business.phone}`, 15, y + 16);
  doc.text(`Email: ${business.email}`, 15, y + 21);

  // BILL TO
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("BILLED TO / CUSTOMER:", 120, y);

  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(invoice.customerName, 120, y + 6);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  doc.text(`Customer Code: ${invoice.customerId.toUpperCase()}`, 120, y + 11);
  doc.text(`Phone: ${invoice.customerPhone}`, 120, y + 16);
  if (invoice.customerEmail) {
    doc.text(`Email: ${invoice.customerEmail}`, 120, y + 21);
  }

  // Meta Info Box (Dates, Payment Terms)
  y = 75;
  doc.setFillColor(244, 244, 245);
  doc.roundedRect(15, y, 180, 16, 2, 2, "F");

  doc.setFontSize(8);
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  doc.text("ISSUE DATE", 22, y + 6);
  doc.text("DUE DATE", 80, y + 6);
  doc.text("PAYMENT TERMS", 140, y + 6);

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text(formatDate(invoice.issueDate, false), 22, y + 12);
  doc.text(formatDate(invoice.dueDate, false), 80, y + 12);
  doc.text(invoice.paymentTerms || "Due in 15 days", 140, y + 12);

  // Table Headers
  y = 102;
  doc.setFillColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.rect(15, y, 180, 8, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("#", 20, y + 5.5);
  doc.text("ITEM DESCRIPTION", 32, y + 5.5);
  doc.text("QTY", 120, y + 5.5, { align: "right" });
  doc.text("UNIT PRICE", 155, y + 5.5, { align: "right" });
  doc.text("TOTAL", 190, y + 5.5, { align: "right" });

  // Items List
  y += 10;
  invoice.items.forEach((item, index) => {
    const lineTotal = item.quantity * item.price;
    const isEven = index % 2 === 0;

    if (isEven) {
      doc.setFillColor(250, 250, 250);
      doc.rect(15, y - 2, 180, 8, "F");
    }

    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    doc.text(`${index + 1}`, 20, y + 3.5);
    doc.text(item.name, 32, y + 3.5);
    doc.text(`${item.quantity}`, 120, y + 3.5, { align: "right" });
    doc.text(formatCurrency(item.price, invoice.currency, false), 155, y + 3.5, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.text(formatCurrency(lineTotal, invoice.currency, false), 190, y + 3.5, { align: "right" });

    y += 8;
  });

  // Summary / Totals Table
  y += 6;
  doc.setDrawColor(228, 228, 231);
  doc.line(110, y, 195, y);
  y += 6;

  const rightAlign = 190;
  const labelAlign = 145;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);

  doc.text("Subtotal:", labelAlign, y, { align: "right" });
  doc.text(formatCurrency(invoice.subtotal, invoice.currency, false), rightAlign, y, { align: "right" });
  y += 6;

  if (invoice.discount > 0) {
    doc.text("Discount:", labelAlign, y, { align: "right" });
    doc.setTextColor(239, 68, 68);
    doc.text(`-${formatCurrency(invoice.discount, invoice.currency, false)}`, rightAlign, y, { align: "right" });
    y += 6;
  }

  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  doc.text(`VAT (${invoice.vatRate}% Egyptian Tax):`, labelAlign, y, { align: "right" });
  doc.text(formatCurrency(invoice.vatAmount, invoice.currency, false), rightAlign, y, { align: "right" });
  y += 8;

  // Grand Total Box
  doc.setFillColor(16, 185, 129);
  doc.roundedRect(110, y - 4, 85, 12, 2, 2, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL DUE:", 115, y + 3.5);
  doc.setFontSize(12);
  doc.text(formatCurrency(invoice.total, invoice.currency, false), 190, y + 3.5, { align: "right" });

  // Bank details & Notes
  y += 24;
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("PAYMENT INSTRUCTIONS & BANK DETAILS", 15, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  y += 5;
  doc.text(`Bank: ${business.bankDetails.bankName}`, 15, y);
  y += 4.5;
  doc.text(`IBAN: ${business.bankDetails.iban}`, 15, y);
  y += 4.5;
  doc.text(`InstaPay: ${business.bankDetails.instaPayHandle} | Vodafone Cash: ${business.bankDetails.vodafoneCashNumber}`, 15, y);

  if (invoice.notes) {
    y += 8;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text("Notes / Remarks:", 15, y);
    y += 4.5;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text(invoice.notes, 15, y);
  }

  // Footer stamp
  doc.setFontSize(8);
  doc.setTextColor(160, 160, 160);
  doc.text("Generated by Hasebha (احسبها) - The all-in-one business accountant in your pocket.", 105, 285, { align: "center" });

  doc.save(`${invoice.invoiceNumber}.pdf`);
}
