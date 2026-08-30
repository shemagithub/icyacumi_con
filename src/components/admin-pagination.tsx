"use client";

import { PAGE_SIZE_OPTIONS } from "@/lib/pagination";

function pageNumbers(current: number, total: number): number[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  if (current <= 3) {
    pages.add(2);
    pages.add(3);
    pages.add(4);
  }
  if (current >= total - 2) {
    pages.add(total - 1);
    pages.add(total - 2);
    pages.add(total - 3);
  }
  return [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
}

export function AdminPagination({
  page,
  pageSize,
  total,
  totalPages,
  start,
  end,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  start: number;
  end: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}) {
  if (total === 0) return null;

  const pages = pageNumbers(page, totalPages);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--portal-line)] px-5 py-3 text-sm">
      <p className="text-[var(--portal-muted)]">
        Showing{" "}
        <span className="font-semibold text-[var(--portal-ink,#111)]">
          {start}-{end}
        </span>{" "}
        of <span className="font-semibold text-[var(--portal-ink,#111)]">{total}</span>
        {totalPages > 1 ? (
          <span className="ml-1">· page {page} of {totalPages}</span>
        ) : null}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-xs text-[var(--portal-muted)]">
          Rows per page
          <select
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            className="portal-input !w-auto !py-1.5 !text-xs"
            aria-label="Rows per page"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="portal-btn portal-btn--ghost !px-2.5 !py-1.5 !text-xs disabled:opacity-40"
          >
            Prev
          </button>

          {pages.map((num, index) => {
            const prev = pages[index - 1];
            const showGap = prev != null && num - prev > 1;
            return (
              <span key={num} className="contents">
                {showGap ? (
                  <span className="px-1 text-xs text-[var(--portal-muted)]" aria-hidden>
                    …
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={() => onPageChange(num)}
                  aria-label={`Page ${num}`}
                  aria-current={num === page ? "page" : undefined}
                  className={`portal-btn !min-w-[2rem] !px-2 !py-1.5 !text-xs ${
                    num === page
                      ? "portal-btn--accent"
                      : "portal-btn--ghost"
                  }`}
                >
                  {num}
                </button>
              </span>
            );
          })}

          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="portal-btn portal-btn--ghost !px-2.5 !py-1.5 !text-xs disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
