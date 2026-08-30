export type ExportColumn = {
  key: string;
  label: string;
  width?: number;
};

/** Download an admin table as PDF via the backend export endpoint. */
export async function exportTablePdf(opts: {
  title: string;
  subtitle?: string;
  columns: ExportColumn[];
  rows: Array<Record<string, string | number | null | undefined>>;
}) {
  const response = await fetch("/api/admin/export/pdf", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(opts),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      typeof data.error === "string" ? data.error : "PDF export failed.",
    );
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);
  const safe = opts.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
  anchor.href = url;
  anchor.download = `bone-koboyi-${safe || "export"}-${stamp}.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
