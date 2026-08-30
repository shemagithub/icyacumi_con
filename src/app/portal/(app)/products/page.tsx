"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminPagination } from "@/components/admin-pagination";
import {
  PortalProductFormModal,
  type PortalProductPayload,
} from "@/components/portal-product-form-modal";
import { formatPrice } from "@/lib/format";
import { usePagination } from "@/lib/pagination";
import type { Product } from "@/lib/types";

export default function PortalProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [stockDrafts, setStockDrafts] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const response = await fetch("/api/portal/products");
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Failed to load");
      return;
    }
    const list = (data.products ?? []) as Product[];
    setProducts(list);
    setStockDrafts(
      Object.fromEntries(
        list.map((product) => [product.id, String(product.stockQuantity ?? 0)]),
      ),
    );
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function createProduct(payload: PortalProductPayload) {
    setPending(true);
    setFormError(null);
    const response = await fetch("/api/portal/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    setPending(false);
    if (!response.ok) {
      setFormError(data.error ?? "Create failed");
      return false;
    }
    setModalOpen(false);
    await load();
    return true;
  }

  async function saveStock(product: Product) {
    const qty = Math.max(0, Math.round(Number(stockDrafts[product.id]) || 0));
    setError(null);
    const response = await fetch(`/api/portal/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stockQuantity: qty }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Could not update stock");
      return;
    }
    await load();
  }

  async function toggleStock(product: Product) {
    await fetch(`/api/portal/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inStock: !product.inStock }),
    });
    await load();
  }

  async function remove(product: Product) {
    if (!confirm(`Delete ${product.name}?`)) return;
    await fetch(`/api/portal/products/${product.id}`, { method: "DELETE" });
    await load();
  }

  const filtered = useMemo(
    () =>
      products.filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase()),
      ),
    [products, query],
  );
  const pagination = usePagination(filtered, 10, query);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Products</h1>
          <p className="mt-1 text-sm text-[var(--portal-muted)]">
            Publish full listings with sizes, colours, fabric, and stock. Sales
            reduce quantity until the item shows sold out.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="portal-badge portal-badge--muted">{products.length} total</span>
          <button
            type="button"
            onClick={() => {
              setFormError(null);
              setModalOpen(true);
            }}
            className="portal-btn portal-btn--accent"
          >
            + Add product
          </button>
        </div>
      </header>

      {error ? (
        <p className="rounded-2xl bg-orange-50 px-4 py-3 text-sm text-[var(--portal-accent)]">
          {error}
        </p>
      ) : null}

      <section className="portal-card overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-[var(--portal-line)] px-5 py-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            className="portal-input max-w-xs flex-1"
          />
          <span className="text-xs text-[var(--portal-muted)]">{filtered.length} shown</span>
        </div>
        <ul className="divide-y divide-[var(--portal-line)]">
          {pagination.items.map((product) => (
            <li key={product.id} className="space-y-3 px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 gap-3">
                  {product.images?.[0]?.src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.images[0].src}
                      alt=""
                      className="h-16 w-14 shrink-0 rounded-lg object-cover"
                    />
                  ) : null}
                  <div className="min-w-0">
                    <p className="font-semibold">{product.name}</p>
                    <p className="mt-0.5 text-xs text-[var(--portal-muted)]">
                      {product.tagline}
                    </p>
                    <p className="mt-1 text-sm tabular-nums">
                      {formatPrice(product.price)}
                      {product.compareAtPrice ? (
                        <span className="ml-2 text-[var(--portal-muted)] line-through">
                          {formatPrice(product.compareAtPrice)}
                        </span>
                      ) : null}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span
                        className={`portal-badge ${
                          product.inStock ? "portal-badge--ok" : "portal-badge--warn"
                        }`}
                      >
                        {product.inStock
                          ? `${product.stockQuantity} in stock`
                          : "Sold out"}
                      </span>
                      <span className="portal-badge portal-badge--muted capitalize">
                        {product.category}
                      </span>
                      <span className="portal-badge portal-badge--muted">
                        {product.views} views
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/shop/${product.slug}`}
                    className="portal-btn portal-btn--ghost !py-2 !text-xs"
                  >
                    View
                  </Link>
                  <button
                    type="button"
                    onClick={() => void toggleStock(product)}
                    className="portal-btn portal-btn--ghost !py-2 !text-xs"
                  >
                    {product.inStock ? "Mark sold out" : "Restock 1+"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void remove(product)}
                    className="portal-btn portal-btn--ghost !py-2 !text-xs text-[var(--portal-accent)]"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap items-end gap-2">
                <label className="block">
                  <span className="mb-1 block text-[10px] font-semibold tracking-[0.08em] text-[var(--portal-muted)] uppercase">
                    Update quantity
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={stockDrafts[product.id] ?? "0"}
                    onChange={(e) =>
                      setStockDrafts((prev) => ({
                        ...prev,
                        [product.id]: e.target.value,
                      }))
                    }
                    className="portal-input !w-28 !py-1.5 !text-sm"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => void saveStock(product)}
                  className="portal-btn portal-btn--ghost !py-2 !text-xs"
                >
                  Save stock
                </button>
              </div>
            </li>
          ))}
          {filtered.length === 0 ? (
            <li className="px-5 py-12 text-center">
              <p className="text-sm text-[var(--portal-muted)]">
                No products yet. Add your first full listing.
              </p>
              <button
                type="button"
                onClick={() => {
                  setFormError(null);
                  setModalOpen(true);
                }}
                className="portal-btn portal-btn--accent mt-4"
              >
                + Add product
              </button>
            </li>
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

      <PortalProductFormModal
        open={modalOpen}
        pending={pending}
        error={formError}
        onClose={() => {
          if (!pending) setModalOpen(false);
        }}
        onSubmit={createProduct}
      />
    </div>
  );
}
