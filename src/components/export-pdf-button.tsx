"use client";

import { useState } from "react";
import { exportTablePdf, type ExportColumn } from "@/lib/export-pdf";

export function ExportPdfButton({
  title,
  subtitle,
  columns,
  rows,
  disabled,
  className = "",
}: {
  title: string;
  subtitle?: string;
  columns: ExportColumn[];
  rows: Array<Record<string, string | number | null | undefined>>;
  disabled?: boolean;
  className?: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onExport() {
    setPending(true);
    setError(null);
    try {
      await exportTablePdf({ title, subtitle, columns, rows });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={`inline-flex flex-col items-end gap-1 ${className}`.trim()}>
      <button
        type="button"
        disabled={disabled || pending || rows.length === 0}
        onClick={() => void onExport()}
        className="portal-btn portal-btn--ghost !py-2 !text-xs disabled:opacity-60"
      >
        {pending ? "Exporting…" : "Export PDF"}
      </button>
      {error ? (
        <p className="max-w-[14rem] text-right text-[0.65rem] text-[var(--portal-accent)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
