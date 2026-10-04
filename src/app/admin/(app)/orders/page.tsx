"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminPagination } from "@/components/admin-pagination";
import { ExportPdfButton } from "@/components/export-pdf-button";
import { formatPrice } from "@/lib/format";
import { usePagination } from "@/lib/pagination";

const STATUSES = [
  "paid",
  "processing",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const;

type OrderRow = {
  id: string;
  reference: string;
  email: string;
  customerName: string;
  status: string;
  statusLabel: string;
  total: number;
  trackingCode: string | null;
  carrier: string | null;
  createdAt: string;
  items: Array<{ name: string; quantity: number }>;
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pendingRef, setPendingRef] = useState<string | null>(null);
  const pagination = usePagination(orders);

  const load = useCallback(async () => {
    const response = await fetch("/api/admin/orders", { credentials: "include" });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Failed to load orders");
      return;
    }
    setOrders(data.orders ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function updateOrder(
    order: OrderRow,
    patch: { status?: string; trackingCode?: string; carrier?: string },
  ) {
    setPendingRef(order.reference);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/orders/${order.reference}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Could not update order.");
        return;
      }
      setMessage(`${order.reference} updated.`);
      await load();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setPendingRef(null);
    }
  }

  const exportRows = useMemo(
    () =>
      orders.map((order) => ({
        reference: order.reference,
        customer: order.customerName,
        email: order.email,
        status: order.statusLabel || order.status,
        total: order.total,
        items: order.items
          .map((item) => `${item.quantity}× ${item.name}`)
          .join("; "),
        createdAt: new Date(order.createdAt).toLocaleString("en-GB"),
      })),
    [orders],
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[0.65rem] font-bold tracking-[0.16em] text-[var(--portal-muted)] uppercase">
            Marketplace
          </p>
          <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
          <p className="mt-1 text-sm text-[var(--portal-muted)]">
            Fulfillment · update status and tracking so customers can follow delivery.
          </p>
        </div>
        <ExportPdfButton
          title="Orders"
          columns={[
            { key: "reference", label: "Reference", width: 90 },
            { key: "customer", label: "Customer", width: 100 },
            { key: "email", label: "Email", width: 120 },
            { key: "status", label: "Status", width: 80 },
            { key: "total", label: "Total (RWF)", width: 70 },
            { key: "items", label: "Items", width: 160 },
            { key: "createdAt", label: "Created", width: 90 },
          ]}
          rows={exportRows}
        />
      </header>

      {message ? (
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="text-sm text-[var(--portal-accent)]">{error}</p>
      ) : null}

      <section className="space-y-4">
        {orders.length === 0 ? (
          <p className="portal-card px-5 py-8 text-sm text-[var(--portal-muted)]">
            No orders yet.
          </p>
        ) : (
          pagination.items.map((order) => (
            <article key={order.id} className="portal-card space-y-4 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold tracking-wide uppercase">
                    {order.reference}
                  </p>
                  <p className="mt-1 text-sm text-[var(--portal-muted)]">
                    {order.customerName} · {order.email}
                  </p>
                  <p className="mt-1 text-xs text-[var(--portal-muted)]">
                    {order.items
                      .map((item) => `${item.quantity}× ${item.name}`)
                      .join(" · ")}
                  </p>
                  <p className="mt-2 text-sm font-semibold tabular-nums">
                    {formatPrice(order.total)}
                  </p>
                </div>
                <Link
                  href={`/track/${encodeURIComponent(order.reference)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold tracking-[0.12em] text-[var(--portal-accent)] uppercase underline"
                >
                  Public track
                </Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <label className="block text-xs">
                  <span className="mb-1 block font-semibold tracking-[0.12em] text-[var(--portal-muted)] uppercase">
                    Status
                  </span>
                  <select
                    className="portal-input"
                    value={order.status}
                    disabled={pendingRef === order.reference}
                    onChange={(event) =>
                      void updateOrder(order, { status: event.target.value })
                    }
                  >
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs sm:col-span-1">
                  <span className="mb-1 block font-semibold tracking-[0.12em] text-[var(--portal-muted)] uppercase">
                    Carrier
                  </span>
                  <input
                    className="portal-input"
                    defaultValue={order.carrier ?? ""}
                    placeholder="e.g. DHL"
                    onBlur={(event) => {
                      const value = event.target.value.trim();
                      if (value === (order.carrier ?? "")) return;
                      void updateOrder(order, { carrier: value });
                    }}
                  />
                </label>
                <label className="block text-xs sm:col-span-2">
                  <span className="mb-1 block font-semibold tracking-[0.12em] text-[var(--portal-muted)] uppercase">
                    Tracking code
                  </span>
                  <input
                    className="portal-input"
                    defaultValue={order.trackingCode ?? ""}
                    placeholder="Tracking number"
                    onBlur={(event) => {
                      const value = event.target.value.trim();
                      if (value === (order.trackingCode ?? "")) return;
                      void updateOrder(order, { trackingCode: value });
                    }}
                  />
                </label>
              </div>
            </article>
          ))
        )}
        {orders.length > 0 ? (
          <div className="portal-card overflow-hidden">
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
          </div>
        ) : null}
      </section>
    </div>
  );
}
