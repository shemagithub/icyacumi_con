"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminPagination } from "@/components/admin-pagination";
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

type SaleLine = {
  id: string;
  date: string;
  reference: string;
  orderStatus: string;
  statusLabel: string;
  customerName: string;
  paymentMethod: string | null;
  trackingCode: string | null;
  carrier: string | null;
  kind: "product" | "ticket";
  name: string;
  size: string;
  color: string;
  quantity: number;
  unitAmount: number;
  lineTotal: number;
  platformCut: number;
  brandKeeps: number;
  imageSrc: string | null;
  canManageOrder?: boolean;
};

type SalesTotals = {
  salesGross: number;
  productSales: number;
  ticketSales: number;
  productUnits: number;
  ticketUnits: number;
  platformCut: number;
  brandKeeps: number;
  orderCount: number;
  lineCount: number;
};

type OrderGroup = {
  reference: string;
  date: string;
  customerName: string;
  paymentMethod: string | null;
  orderStatus: string;
  statusLabel: string;
  trackingCode: string | null;
  carrier: string | null;
  canManageOrder: boolean;
  lines: SaleLine[];
  brandKeeps: number;
  lineTotal: number;
};

function paymentLabel(method: string | null) {
  if (!method) return "-";
  if (method === "mtn") return "MoMo";
  if (method === "airtel") return "Airtel";
  if (method === "card") return "Card";
  return method;
}

export default function PortalSalesPage() {
  const [lines, setLines] = useState<SaleLine[]>([]);
  const [totals, setTotals] = useState<SalesTotals | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<"all" | "product" | "ticket">("all");
  const [pendingRef, setPendingRef] = useState<string | null>(null);

  const load = useCallback(async () => {
    const response = await fetch("/api/portal/sales", { credentials: "include" });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Failed to load sales");
      return;
    }
    setLines((data.lines as SaleLine[]) ?? []);
    setTotals((data.totals as SalesTotals) ?? null);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return lines.filter((line) => {
      if (kindFilter !== "all" && line.kind !== kindFilter) return false;
      if (!q) return true;
      return (
        line.reference.toLowerCase().includes(q) ||
        line.name.toLowerCase().includes(q) ||
        line.customerName.toLowerCase().includes(q)
      );
    });
  }, [lines, query, kindFilter]);

  const orders = useMemo(() => {
    const map = new Map<string, OrderGroup>();
    for (const line of filtered) {
      const existing = map.get(line.reference);
      if (existing) {
        existing.lines.push(line);
        existing.brandKeeps += line.brandKeeps;
        existing.lineTotal += line.lineTotal;
        continue;
      }
      map.set(line.reference, {
        reference: line.reference,
        date: line.date,
        customerName: line.customerName,
        paymentMethod: line.paymentMethod,
        orderStatus: line.orderStatus,
        statusLabel: line.statusLabel,
        trackingCode: line.trackingCode,
        carrier: line.carrier,
        canManageOrder: Boolean(line.canManageOrder),
        lines: [line],
        brandKeeps: line.brandKeeps,
        lineTotal: line.lineTotal,
      });
    }
    return [...map.values()];
  }, [filtered]);

  const pagination = usePagination(orders, 8, `${query}:${kindFilter}`);

  async function updateOrder(
    order: OrderGroup,
    patch: { status?: string; trackingCode?: string; carrier?: string },
  ) {
    setPendingRef(order.reference);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/portal/orders/${order.reference}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: patch.status ?? order.orderStatus,
          trackingCode:
            patch.trackingCode !== undefined ? patch.trackingCode : order.trackingCode,
          carrier: patch.carrier !== undefined ? patch.carrier : order.carrier,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Could not update order.");
        return;
      }
      setMessage(data.message ?? `${order.reference} updated.`);
      await load();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setPendingRef(null);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Sales</h1>
          <p className="mt-1 text-sm text-[var(--portal-muted)]">
            Orders with your products · update status and tracking so buyers get notified.
          </p>
        </div>
        <Link href="/portal/payments" className="portal-btn portal-btn--ghost">
          Withdraw earnings →
        </Link>
      </header>

      {message ? (
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-2xl bg-orange-50 px-4 py-3 text-sm text-[var(--portal-accent)]">
          {error}
        </p>
      ) : null}

      {totals ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="portal-card p-4">
            <p className="text-xs text-[var(--portal-muted)]">Gross sales</p>
            <p className="mt-1 text-xl font-bold tabular-nums">
              {formatPrice(totals.salesGross)}
            </p>
            <p className="mt-1 text-xs text-[var(--portal-muted)]">
              {totals.orderCount} order{totals.orderCount === 1 ? "" : "s"}
            </p>
          </div>
          <div className="portal-card p-4">
            <p className="text-xs text-[var(--portal-muted)]">You keep</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-emerald-700">
              {formatPrice(totals.brandKeeps)}
            </p>
            <p className="mt-1 text-xs text-[var(--portal-muted)]">
              Platform cut {formatPrice(totals.platformCut)}
            </p>
          </div>
          <div className="portal-card p-4">
            <p className="text-xs text-[var(--portal-muted)]">Product sales</p>
            <p className="mt-1 text-xl font-bold tabular-nums">
              {formatPrice(totals.productSales)}
            </p>
            <p className="mt-1 text-xs text-[var(--portal-muted)]">
              {totals.productUnits} unit{totals.productUnits === 1 ? "" : "s"}
            </p>
          </div>
          <div className="portal-card p-4">
            <p className="text-xs text-[var(--portal-muted)]">Ticket sales</p>
            <p className="mt-1 text-xl font-bold tabular-nums">
              {formatPrice(totals.ticketSales)}
            </p>
            <p className="mt-1 text-xs text-[var(--portal-muted)]">
              {totals.ticketUnits} ticket{totals.ticketUnits === 1 ? "" : "s"}
            </p>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search reference, item, customer…"
          className="portal-input max-w-sm flex-1"
        />
        <div className="flex flex-wrap gap-1">
          {(
            [
              ["all", "All"],
              ["product", "Products"],
              ["ticket", "Tickets"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setKindFilter(value)}
              className={`portal-btn !py-1.5 !text-xs ${
                kindFilter === value ? "portal-btn--accent" : "portal-btn--ghost"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="text-xs text-[var(--portal-muted)]">
          {orders.length} order{orders.length === 1 ? "" : "s"}
        </span>
      </div>

      <section className="space-y-4">
        {pagination.items.map((order) => {
          const busy = pendingRef === order.reference;
          return (
            <article key={order.reference} className="portal-card space-y-4 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold tracking-wide uppercase">
                    {order.reference}
                  </p>
                  <p className="mt-1 text-sm text-[var(--portal-muted)]">
                    {order.customerName || "Customer"} · {paymentLabel(order.paymentMethod)}
                  </p>
                  <p className="mt-1 text-xs text-[var(--portal-muted)]">
                    {new Date(order.date).toLocaleString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="mt-2 text-sm font-semibold tabular-nums text-emerald-700">
                    You keep {formatPrice(order.brandKeeps)}
                    <span className="ml-2 font-normal text-[var(--portal-muted)]">
                      · lines {formatPrice(order.lineTotal)}
                    </span>
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

              <ul className="space-y-2 border-t border-[var(--portal-line)] pt-3">
                {order.lines.map((line) => (
                  <li key={line.id} className="flex items-start gap-3 text-sm">
                    {line.imageSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={line.imageSrc}
                        alt=""
                        className="h-12 w-10 shrink-0 rounded object-cover"
                      />
                    ) : (
                      <div className="h-12 w-10 shrink-0 rounded bg-[var(--portal-bg)]" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{line.name}</p>
                      <p className="text-xs text-[var(--portal-muted)]">
                        <span className="capitalize">{line.kind}</span>
                        {line.kind === "product"
                          ? ` · ${line.size} · ${line.color}`
                          : null}
                        {` · Qty ${line.quantity}`}
                      </p>
                    </div>
                    <p className="shrink-0 tabular-nums font-semibold">
                      {formatPrice(line.lineTotal)}
                    </p>
                  </li>
                ))}
              </ul>

              {order.canManageOrder ? (
                <div className="grid gap-3 border-t border-[var(--portal-line)] pt-4 sm:grid-cols-2 lg:grid-cols-4">
                  <label className="block text-xs">
                    <span className="mb-1 block font-semibold tracking-[0.12em] text-[var(--portal-muted)] uppercase">
                      Status
                    </span>
                    <select
                      className="portal-input appearance-none"
                      value={order.orderStatus}
                      disabled={busy}
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
                  <label className="block text-xs">
                    <span className="mb-1 block font-semibold tracking-[0.12em] text-[var(--portal-muted)] uppercase">
                      Carrier
                    </span>
                    <input
                      className="portal-input"
                      defaultValue={order.carrier ?? ""}
                      key={`${order.reference}-carrier-${order.carrier ?? ""}`}
                      placeholder="e.g. DHL"
                      disabled={busy}
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
                      key={`${order.reference}-track-${order.trackingCode ?? ""}`}
                      placeholder="Tracking number"
                      disabled={busy}
                      onBlur={(event) => {
                        const value = event.target.value.trim();
                        if (value === (order.trackingCode ?? "")) return;
                        void updateOrder(order, { trackingCode: value });
                      }}
                    />
                  </label>
                  <p className="sm:col-span-2 lg:col-span-4 text-xs text-[var(--portal-muted)]">
                    Changes email the customer (and your brand inbox). Current:{" "}
                    <strong>{order.statusLabel || order.orderStatus}</strong>
                    {busy ? " · Saving…" : null}
                  </p>
                </div>
              ) : null}
            </article>
          );
        })}

        {orders.length === 0 ? (
          <p className="portal-card px-5 py-10 text-center text-sm text-[var(--portal-muted)]">
            No sales yet. When someone buys your products, orders show up here to fulfill.
          </p>
        ) : null}
      </section>

      <AdminPagination {...pagination} />
    </div>
  );
}
