import type { ProductFilters } from "@/lib/types";

/**
 * Builds a /shop URL from the active filters plus a patch. Passing
 * `undefined` for a key in the patch clears that filter.
 */
export function shopHref(
  current: ProductFilters,
  patch: Partial<ProductFilters> = {},
): string {
  const next = { ...current, ...patch };
  const params = new URLSearchParams();

  if (next.category) params.set("category", next.category);
  if (next.collection) params.set("collection", next.collection);
  if (next.size) params.set("size", next.size);
  if (next.color) params.set("color", next.color);
  if (next.vendor) params.set("vendor", next.vendor);
  if (next.sort && next.sort !== "featured") params.set("sort", next.sort);

  const query = params.toString();
  return query ? `/shop?${query}` : "/shop";
}

export function hasActiveFilters(filters: ProductFilters): boolean {
  return Boolean(
    filters.category || filters.collection || filters.size || filters.color,
  );
}
