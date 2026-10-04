import PDFDocument from "pdfkit";

export type TablePdfColumn = {
  key: string;
  label: string;
  width?: number;
};

export type TablePdfInput = {
  title: string;
  subtitle?: string;
  columns: TablePdfColumn[];
  rows: Array<Record<string, string | number | null | undefined>>;
};

/** Generic multi-page table PDF for admin exports. */
export async function buildTablePdf(input: TablePdfInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margin: 36,
      info: {
        Title: input.title,
        Author: "ICYACUMI Admin",
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth =
      doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const columns = input.columns.map((column) => ({
      ...column,
      width: column.width ?? Math.floor(pageWidth / Math.max(1, input.columns.length)),
    }));

    // Normalize widths to fit page.
    const widthSum = columns.reduce((sum, column) => sum + (column.width || 0), 0);
    const scale = widthSum > 0 ? pageWidth / widthSum : 1;
    for (const column of columns) {
      column.width = Math.floor((column.width || 0) * scale);
    }

    function drawHeader(y: number) {
      doc
        .fillColor("#1a1410")
        .font("Helvetica-Bold")
        .fontSize(16)
        .text(input.title, doc.page.margins.left, y, { width: pageWidth });
      let nextY = doc.y + 4;
      if (input.subtitle) {
        doc
          .fillColor("#6b5e52")
          .font("Helvetica")
          .fontSize(9)
          .text(input.subtitle, doc.page.margins.left, nextY, { width: pageWidth });
        nextY = doc.y + 8;
      } else {
        nextY += 6;
      }
      doc
        .fillColor("#6b5e52")
        .font("Helvetica")
        .fontSize(8)
        .text(
          `Exported ${new Date().toLocaleString("en-GB")} · ${input.rows.length} row(s)`,
          doc.page.margins.left,
          nextY,
          { width: pageWidth },
        );
      nextY = doc.y + 10;

      doc
        .moveTo(doc.page.margins.left, nextY)
        .lineTo(doc.page.margins.left + pageWidth, nextY)
        .strokeColor("#e30613")
        .lineWidth(1.5)
        .stroke();
      nextY += 8;

      let x = doc.page.margins.left;
      doc.fillColor("#1a1410").font("Helvetica-Bold").fontSize(8);
      for (const column of columns) {
        doc.text(column.label, x, nextY, {
          width: column.width,
          ellipsis: true,
        });
        x += column.width || 0;
      }
      nextY = Math.max(nextY + 12, doc.y + 4);
      doc
        .moveTo(doc.page.margins.left, nextY)
        .lineTo(doc.page.margins.left + pageWidth, nextY)
        .strokeColor("#d0c2ae")
        .lineWidth(1)
        .stroke();
      return nextY + 6;
    }

    let y = drawHeader(doc.page.margins.top);
    doc.font("Helvetica").fontSize(8).fillColor("#1a1410");

    for (const row of input.rows) {
      if (y > doc.page.height - 48) {
        doc.addPage();
        y = drawHeader(doc.page.margins.top);
        doc.font("Helvetica").fontSize(8).fillColor("#1a1410");
      }

      let x = doc.page.margins.left;
      let rowHeight = 12;
      for (const column of columns) {
        const value = row[column.key];
        const text =
          value === null || value === undefined ? "-" : String(value);
        const height = doc.heightOfString(text, {
          width: (column.width || 40) - 4,
        });
        rowHeight = Math.max(rowHeight, height);
      }

      x = doc.page.margins.left;
      for (const column of columns) {
        const value = row[column.key];
        const text =
          value === null || value === undefined ? "-" : String(value);
        doc.text(text, x, y, {
          width: (column.width || 40) - 4,
          ellipsis: true,
        });
        x += column.width || 0;
      }
      y += rowHeight + 6;
    }

    doc.end();
  });
}
