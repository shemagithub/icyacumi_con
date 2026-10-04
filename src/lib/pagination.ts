import { useEffect, useMemo, useState } from "react";

export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [5, 10, 25, 50] as const;

export function paginateItems<T>(
  items: T[],
  page: number,
  pageSize: number,
) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  const end = Math.min(start + pageSize, total);
  return {
    page: safePage,
    pageSize,
    total,
    totalPages,
    start: total === 0 ? 0 : start + 1,
    end,
    items: items.slice(start, end),
  };
}

/** Client-side pagination for admin / portal tables. */
export function usePagination<T>(
  items: T[],
  initialPageSize = DEFAULT_PAGE_SIZE,
  /** Change this (e.g. search query) to jump back to page 1. */
  resetKey?: string | number,
) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const result = useMemo(
    () => paginateItems(items, page, pageSize),
    [items, page, pageSize],
  );

  useEffect(() => {
    if (page !== result.page) setPage(result.page);
  }, [page, result.page]);

  useEffect(() => {
    setPage(1);
  }, [pageSize, resetKey]);

  return {
    ...result,
    setPage,
    setPageSize,
    onPageChange: setPage,
    onPageSizeChange: setPageSize,
    goFirst: () => setPage(1),
    goPrev: () => setPage((value) => Math.max(1, value - 1)),
    goNext: () => setPage((value) => Math.min(result.totalPages, value + 1)),
    goLast: () => setPage(result.totalPages),
  };
}
