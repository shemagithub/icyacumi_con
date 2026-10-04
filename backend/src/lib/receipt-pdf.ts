import PDFDocument from "pdfkit";

export type ReceiptPdfLine = {
  name: string;
  quantity: number;
  unitAmount: number;
  brandName?: string;
  meta?: string;
};

export type ReceiptPdfInput = {
  reference: string;
  customerName?: string;
  email?: string;
  lines: ReceiptPdfLine[];
  shipping?: number;
  discount?: number;
  couponCode?: string | null;
  total: number;
  shippingAddress?: string;
  paymentMethod?: string | null;
  paidAt?: Date | string | null;
};

function formatRwf(amount: number) {
  return `RF ${Math.round(amount).toLocaleString("en-US")}`;
}

function paymentLabel(method?: string | null) {
  if (method === "mtn") return "MTN MoMo";
  if (method === "airtel") return "Airtel Money";
  if (method === "card") return "Card";
  return method?.trim() || "Paid";
}

function formatDate(value?: Date | string | null) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return new Date().toLocaleString("en-GB");
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Build a simple one-page order receipt PDF. */
export async function buildOrderReceiptPdf(input: ReceiptPdfInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 48,
      info: {
        Title: `Receipt ${input.reference}`,
        Author: "ICYACUMI",
        Subject: "Order receipt",
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    let y = doc.page.margins.top;

    doc
      .fillColor("#1a1410")
      .font("Helvetica-Bold")
      .fontSize(22)
      .text("ICYACUMI", { width: pageWidth });
    y = doc.y + 4;
    doc
      .fillColor("#6b5e52")
      .font("Helvetica")
      .fontSize(10)
      .text("Order receipt", doc.page.margins.left, y, { width: pageWidth });
    y = doc.y + 18;

    doc
      .moveTo(doc.page.margins.left, y)
      .lineTo(doc.page.margins.left + pageWidth, y)
      .strokeColor("#e30613")
      .lineWidth(2)
      .stroke();
    y += 16;

    doc.fillColor("#1a1410").font("Helvetica-Bold").fontSize(11);
    doc.text(`Reference: ${input.reference}`, doc.page.margins.left, y);
    y = doc.y + 4;
    doc.font("Helvetica").fontSize(10).fillColor("#6b5e52");
    doc.text(`Date: ${formatDate(input.paidAt)}`, doc.page.margins.left, y);
    y = doc.y + 2;
    doc.text(`Payment: ${paymentLabel(input.paymentMethod)}`, doc.page.margins.left, y);
    y = doc.y + 14;

    if (input.customerName || input.email) {
      doc.fillColor("#1a1410").font("Helvetica-Bold").fontSize(11).text("Bill to", doc.page.margins.left, y);
      y = doc.y + 4;
      doc.fillColor("#1a1410").font("Helvetica").fontSize(10);
      if (input.customerName) {
        doc.text(input.customerName, doc.page.margins.left, y);
        y = doc.y + 2;
      }
      if (input.email) {
        doc.fillColor("#6b5e52").text(input.email, doc.page.margins.left, y);
        y = doc.y + 2;
      }
      y += 10;
    }

    if (input.shippingAddress) {
      doc.fillColor("#1a1410").font("Helvetica-Bold").fontSize(11).text("Ship to", doc.page.margins.left, y);
      y = doc.y + 4;
      doc
        .fillColor("#6b5e52")
        .font("Helvetica")
        .fontSize(10)
        .text(input.shippingAddress, doc.page.margins.left, y, { width: pageWidth });
      y = doc.y + 14;
    }

    // Table header
    const colItem = doc.page.margins.left;
    const colQty = doc.page.margins.left + pageWidth * 0.62;
    const colAmount = doc.page.margins.left + pageWidth * 0.78;

    doc
      .moveTo(doc.page.margins.left, y)
      .lineTo(doc.page.margins.left + pageWidth, y)
      .strokeColor("#d0c2ae")
      .lineWidth(1)
      .stroke();
    y += 8;

    doc.fillColor("#1a1410").font("Helvetica-Bold").fontSize(9);
    doc.text("ITEM", colItem, y, { width: pageWidth * 0.58 });
    doc.text("QTY", colQty, y, { width: pageWidth * 0.14, align: "center" });
    doc.text("AMOUNT", colAmount, y, { width: pageWidth * 0.22, align: "right" });
    y = doc.y + 6;

    doc
      .moveTo(doc.page.margins.left, y)
      .lineTo(doc.page.margins.left + pageWidth, y)
      .strokeColor("#d0c2ae")
      .stroke();
    y += 10;

    doc.font("Helvetica").fontSize(10);
    for (const line of input.lines) {
      const lineTotal = line.unitAmount * line.quantity;
      const details = [line.brandName, line.meta].filter(Boolean).join(" · ");
      const startY = y;

      doc.fillColor("#1a1410").text(line.name, colItem, startY, {
        width: pageWidth * 0.58,
      });
      let afterNameY = doc.y;
      if (details) {
        doc
          .fillColor("#6b5e52")
          .fontSize(8)
          .text(details, colItem, afterNameY + 1, { width: pageWidth * 0.58 });
        afterNameY = doc.y;
        doc.fontSize(10);
      }

      doc.fillColor("#1a1410").text(String(line.quantity), colQty, startY, {
        width: pageWidth * 0.14,
        align: "center",
      });
      doc.text(formatRwf(lineTotal), colAmount, startY, {
        width: pageWidth * 0.22,
        align: "right",
      });

      y = Math.max(afterNameY, startY + 14) + 10;

      if (y > doc.page.height - 120) {
        doc.addPage();
        y = doc.page.margins.top;
      }
    }

    doc
      .moveTo(doc.page.margins.left, y)
      .lineTo(doc.page.margins.left + pageWidth, y)
      .strokeColor("#d0c2ae")
      .stroke();
    y += 14;

    const discount = Math.max(0, Math.round(input.discount ?? 0));
    if (discount > 0) {
      const label = input.couponCode
        ? `Discount (${input.couponCode})`
        : "Discount";
      doc
        .fillColor("#6b5e52")
        .font("Helvetica")
        .fontSize(10)
        .text(label, colItem, y, { width: pageWidth * 0.58, align: "right" });
      doc
        .fillColor("#1a1410")
        .text(`−${formatRwf(discount)}`, colAmount, y, {
          width: pageWidth * 0.22,
          align: "right",
        });
      y = doc.y + 8;
    }

    if (typeof input.shipping === "number") {
      doc
        .fillColor("#6b5e52")
        .font("Helvetica")
        .fontSize(10)
        .text("Shipping", colQty, y, { width: pageWidth * 0.14, align: "right" });
      doc
        .fillColor("#1a1410")
        .text(formatRwf(input.shipping), colAmount, y, {
          width: pageWidth * 0.22,
          align: "right",
        });
      y = doc.y + 8;
    }

    doc
      .fillColor("#1a1410")
      .font("Helvetica-Bold")
      .fontSize(12)
      .text("Total", colQty, y, { width: pageWidth * 0.14, align: "right" });
    doc.text(formatRwf(input.total), colAmount, y, {
      width: pageWidth * 0.22,
      align: "right",
    });
    y = doc.y + 28;

    doc
      .fillColor("#6b5e52")
      .font("Helvetica")
      .fontSize(9)
      .text(
        "Thank you for shopping with ICYACUMI. Keep this PDF as your receipt.",
        doc.page.margins.left,
        y,
        { width: pageWidth },
      );

    doc.end();
  });
}
