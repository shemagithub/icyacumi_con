"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminPagination } from "@/components/admin-pagination";
import { ExportPdfButton } from "@/components/export-pdf-button";
import { formatPrice } from "@/lib/format";
import { usePagination } from "@/lib/pagination";

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  price: number;
  inStock: boolean;
  stockQuantity: number;
  featured: boolean;
  brand: { name: string };
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const pagination = usePagination(products);

  const load = useCallback(async () => {
    const response = await fetch("/api/admin/products", { credentials: "include" });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Failed to load");
      return;
    }
    setProducts(data.products ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggleStock(product: ProductRow) {
    await fetch(`/api/admin/products/${product.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inStock: !product.inStock }),
    });
    await load();
  }

  async function remove(product: ProductRow) {
    if (!confirm(`Delete ${product.name}?`)) return;
    await fetch(`/api/admin/products/${product.id}`, {
      method: "DELETE",
      credentials: "include",
    });
    await load();
  }

  const exportRows = useMemo(
    () =>
      products.map((product) => ({
        name: product.name,
        brand: product.brand.name,
        price: product.price,
        stock: product.inStock
          ? `${product.stockQuantity ?? 0} in stock`
          : "Sold out",
        featured: product.featured ? "Yes" : "No",
        slug: product.slug,
      })),
    [products],
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="mt-1 text-sm text-[var(--portal-muted)]">
            All brand products across the site.
          </p>
        </div>
        <ExportPdfButton
          title="Products"
          columns={[
            { key: "name", label: "Product", width: 140 },
            { key: "brand", label: "Brand", width: 100 },
            { key: "price", label: "Price (RWF)", width: 70 },
            { key: "stock", label: "Stock", width: 70 },
            { key: "featured", label: "Featured", width: 50 },
            { key: "slug", label: "Slug", width: 100 },
          ]}
          rows={exportRows}
        />
      </header>
      {error ? <p className="text-sm text-[var(--portal-accent)]">{error}</p> : null}
      <section className="portal-card overflow-hidden">
        <ul className="divide-y divide-[var(--portal-line)]">
          {pagination.items.map((product) => (
            <li key={product.id} className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
              <div>
                <p className="font-semibold">{product.name}</p>
                <p className="text-xs text-[var(--portal-muted)]">
                  {product.brand.name} · {formatPrice(product.price)}
                </p>
                <span
                  className={`portal-badge mt-2 ${
                    product.inStock ? "portal-badge--ok" : "portal-badge--warn"
                  }`}
                >
                  {product.inStock
                    ? `${product.stockQuantity ?? 0} in stock`
                    : "Sold out"}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void toggleStock(product)}
                  className="portal-btn portal-btn--ghost !py-2 !text-xs"
                >
                  Toggle stock
                </button>
                <button
                  type="button"
                  onClick={() => void remove(product)}
                  className="portal-btn portal-btn--ghost !py-2 !text-xs text-[var(--portal-accent)]"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
          {products.length === 0 ? (
            <li className="px-5 py-10 text-sm text-[var(--portal-muted)]">No products.</li>
          ) : null}
        </ul>
        <AdminPagination
          page={pagination.page}
          pageSize={pagination.pageSize}
          total={pagination.total}
          totalPages={pagination.totalPages}
          start={pagination.start}
          end={pagination.end}
          onPageChange={pagination.setPage}
          onPageSizeChange={pagination.setPageSize}
        />
      </section>
    </div>
  );
}
