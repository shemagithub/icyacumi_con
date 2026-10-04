"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminPagination } from "@/components/admin-pagination";
import { ExportPdfButton } from "@/components/export-pdf-button";
import { formatPrice } from "@/lib/format";
import { usePagination } from "@/lib/pagination";

type BrandMoneyRow = {
  brandId: string;
  brandName: string;
  brandSlug: string;
  status: string;
  payoutProvider: string | null;
  payoutAccount: string | null;
  orderCount: number;
  salesGross: number;
  platformCommission: number;
  productCommission: number;
  ticketCommission: number;
  totalEarned: number;
  paidOut: number;
  pending: number;
  feesCollected: number;
  available: number;
};

type BrandsMoneyOverview = {
  settings: {
    productCommissionPercent: number;
    ticketCommissionPercent: number;
  };
  brands: BrandMoneyRow[];
  totals: {
    salesGross: number;
    platformCommission: number;
    brandEarned: number;
    brandAvailable: number;
    brandPending: number;
    brandPaidOut: number;
    withdrawalFees: number;
    orderCount: number;
    circulatingInBrandAccounts: number;
    circulatingWithPending: number;
    brandCount: number;
    brandsWithBalanceCount: number;
    earningBrandCount: number;
  };
};

type Filter = "all" | "balance" | "earning";

function statusTone(status: string) {
  if (status === "approved") return "ok";
  if (status === "pending") return "warn";
  if (status === "rejected") return "muted";
  return "info";
}

export default function AdminBrandMoneyPage() {
  const [data, setData] = useState<BrandsMoneyOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const load = useCallback(async () => {
    const response = await fetch("/api/admin/brands-money", {
      credentials: "include",
    });
    const json = await response.json();
    if (!response.ok) {
      setError(json.error ?? "Could not load brand money.");
      return;
    }
    setData(json as BrandsMoneyOverview);
    setError(null);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!data) return [];
    let rows = data.brands;
    if (filter === "balance") {
      rows = rows.filter((row) => row.available > 0 || row.pending > 0);
    } else if (filter === "earning") {
      rows = rows.filter((row) => row.totalEarned > 0);
    }
    const q = query.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (row) =>
          row.brandName.toLowerCase().includes(q) ||
          row.brandSlug.toLowerCase().includes(q),
      );
    }
    return rows;
  }, [data, filter, query]);

  const pagination = usePagination(filtered, 15, `${filter}:${query}`);

  const exportRows = useMemo(
    () =>
      filtered.map((row) => ({
        brand: row.brandName,
        status: row.status,
        salesGross: row.salesGross,
        platformCommission: row.platformCommission,
        brandEarned: row.totalEarned,
        available: row.available,
        pending: row.pending,
        paidOut: row.paidOut,
        fees: row.feesCollected,
        orders: row.orderCount,
      })),
    [filtered],
  );

  if (error) {
    return (
      <p className="portal-card px-5 py-4 text-sm text-[var(--portal-accent)]">
        {error}
      </p>
    );
  }

  if (!data) {
    return (
      <p className="text-sm text-[var(--portal-muted)]">
        Loading brand balances…
      </p>
    );
  }

  const { totals, settings } = data;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Brand money
          </h1>
          <p className="mt-2 text-sm leading-6 text-[var(--portal-muted)]">
            See how much each brand still holds, total money circulating across
            brand accounts, and platform commission from their sales. Commission
            rates: products {settings.productCommissionPercent}% · tickets{" "}
            {settings.ticketCommissionPercent}%.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/payouts" className="portal-btn portal-btn--ghost">
            Payouts →
          </Link>
          <Link href="/admin/settings" className="portal-btn portal-btn--ghost">
            Commission →
          </Link>
          <ExportPdfButton
            title="Brand money overview"
            subtitle={`Circulating ${totals.circulatingInBrandAccounts} RWF · Platform cut ${totals.platformCommission} RWF`}
            columns={[
              { key: "brand", label: "Brand", width: 110 },
              { key: "salesGross", label: "Sales", width: 70 },
              { key: "platformCommission", label: "Platform", width: 70 },
              { key: "brandEarned", label: "Earned", width: 70 },
              { key: "available", label: "Available", width: 70 },
              { key: "pending", label: "Pending", width: 60 },
              { key: "paidOut", label: "Paid out", width: 70 },
              { key: "fees", label: "Fees", width: 50 },
            ]}
            rows={exportRows}
          />
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {(
          [
            {
              label: "Circulating in brand accounts",
              value: totals.circulatingInBrandAccounts,
              hint: "Available to withdraw right now",
              tone: "ink" as const,
            },
            {
              label: "With pending payouts",
              value: totals.circulatingWithPending,
              hint: "Available + payouts waiting approval",
              tone: "accent" as const,
            },
            {
              label: "Platform commission earned",
              value: totals.platformCommission,
              hint: "Your cut from all brand sales",
              tone: "default" as const,
            },
            {
              label: "Gross marketplace sales",
              value: totals.salesGross,
              hint: `${totals.earningBrandCount} earning brands · ${totals.orderCount} order lines`,
              tone: "default" as const,
            },
          ] as const
        ).map((card) => {
          const tone = card.tone;
          return (
            <div
              key={card.label}
              className={`admin-stat-card ${
                tone === "ink"
                  ? "admin-stat-card--ink"
                  : tone === "accent"
                    ? "admin-stat-card--accent"
                    : ""
              }`}
            >
              <p
                className={`text-xs font-semibold tracking-[0.08em] uppercase ${
                  tone === "default" ? "text-[var(--portal-muted)]" : "text-white/80"
                }`}
              >
                {card.label}
              </p>
              <p
                className={`mt-3 text-2xl font-bold tracking-tight tabular-nums sm:text-3xl ${
                  tone === "default" ? "text-[var(--portal-ink)]" : "text-white"
                }`}
              >
                {formatPrice(card.value)}
              </p>
              <p
                className={`mt-auto pt-3 text-xs leading-5 ${
                  tone === "default" ? "text-[var(--portal-muted)]" : "text-white/85"
                }`}
              >
                {card.hint}
              </p>
            </div>
          );
        })}
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {(
          [
            ["Brands keep (earned)", totals.brandEarned],
            ["Already paid to brands", totals.brandPaidOut],
            ["Pending brand payouts", totals.brandPending],
            ["Withdrawal fees collected", totals.withdrawalFees],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="admin-stat-card">
            <p className="text-xs font-semibold tracking-[0.08em] text-[var(--portal-muted)] uppercase">
              {label}
            </p>
            <p className="mt-3 text-xl font-bold tracking-tight text-[var(--portal-ink)] tabular-nums">
              {formatPrice(value)}
            </p>
          </div>
        ))}
      </section>

      <section className="portal-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-[var(--portal-line)] px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold">Every brand account</p>
            <p className="text-xs text-[var(--portal-muted)]">
              {totals.brandCount} brands · {totals.brandsWithBalanceCount} with
              money still in account
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                ["all", "All"],
                ["balance", "Has balance"],
                ["earning", "Has sales"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setFilter(id)}
                className={`rounded-full px-3 py-1.5 text-[0.65rem] font-bold tracking-[0.12em] uppercase ${
                  filter === id
                    ? "bg-[var(--portal-accent)] text-white"
                    : "bg-[var(--portal-bg)] text-[var(--portal-muted)]"
                }`}
              >
                {label}
              </button>
            ))}
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search brand…"
              className="portal-input !w-44 !py-1.5 !text-xs"
              aria-label="Search brands"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[56rem] text-left text-sm">
            <thead>
              <tr className="text-xs text-[var(--portal-muted)]">
                <th className="px-5 py-3 font-medium">Brand</th>
                <th className="px-3 py-3 font-medium">Sales</th>
                <th className="px-3 py-3 font-medium">Platform cut</th>
                <th className="px-3 py-3 font-medium">Brand earned</th>
                <th className="px-3 py-3 font-medium">In account</th>
                <th className="px-3 py-3 font-medium">Pending to brand</th>
                <th className="px-3 py-3 font-medium">Paid to brand</th>
                <th className="px-5 py-3 font-medium">Withdraw fees</th>
              </tr>
            </thead>
            <tbody>
              {pagination.items.map((row) => (
                <tr
                  key={row.brandId}
                  className="border-t border-[var(--portal-line)]"
                >
                  <td className="px-5 py-3.5">
                    <Link
                      href={`/brands/${row.brandSlug}`}
                      className="font-medium hover:text-[var(--portal-accent)]"
                    >
                      {row.brandName}
                    </Link>
                    <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--portal-muted)]">
                      <span
                        className={`portal-badge portal-badge--${statusTone(row.status)}`}
                      >
                        {row.status}
                      </span>
                      <span>{row.orderCount} orders</span>
                      {row.payoutProvider ? (
                        <span className="uppercase">{row.payoutProvider}</span>
                      ) : null}
                    </p>
                  </td>
                  <td className="px-3 py-3.5 tabular-nums">
                    {formatPrice(row.salesGross)}
                  </td>
                  <td className="px-3 py-3.5 tabular-nums text-[var(--portal-accent)]">
                    {formatPrice(row.platformCommission)}
                  </td>
                  <td className="px-3 py-3.5 tabular-nums">
                    {formatPrice(row.totalEarned)}
                  </td>
                  <td className="px-3 py-3.5 font-semibold tabular-nums text-emerald-700">
                    {formatPrice(row.available)}
                  </td>
                  <td className="px-3 py-3.5 tabular-nums text-[var(--portal-muted)]">
                    {formatPrice(row.pending)}
                  </td>
                  <td className="px-3 py-3.5 tabular-nums text-[var(--portal-muted)]">
                    {formatPrice(row.paidOut)}
                  </td>
                  <td className="px-5 py-3.5 tabular-nums text-[var(--portal-muted)]">
                    {formatPrice(row.feesCollected)}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-10 text-sm text-[var(--portal-muted)]"
                  >
                    No brands match this filter.
                  </td>
                </tr>
              ) : null}
            </tbody>
            {filtered.length > 0 ? (
              <tfoot>
                <tr className="border-t border-[var(--portal-line)] bg-[var(--portal-bg)] text-sm font-semibold">
                  <td className="px-5 py-3">Filtered total</td>
                  <td className="px-3 py-3 tabular-nums">
                    {formatPrice(
                      filtered.reduce((sum, row) => sum + row.salesGross, 0),
                    )}
                  </td>
                  <td className="px-3 py-3 tabular-nums">
                    {formatPrice(
                      filtered.reduce(
                        (sum, row) => sum + row.platformCommission,
                        0,
                      ),
                    )}
                  </td>
                  <td className="px-3 py-3 tabular-nums">
                    {formatPrice(
                      filtered.reduce((sum, row) => sum + row.totalEarned, 0),
                    )}
                  </td>
                  <td className="px-3 py-3 tabular-nums text-emerald-700">
                    {formatPrice(
                      filtered.reduce((sum, row) => sum + row.available, 0),
                    )}
                  </td>
                  <td className="px-3 py-3 tabular-nums">
                    {formatPrice(
                      filtered.reduce((sum, row) => sum + row.pending, 0),
                    )}
                  </td>
                  <td className="px-3 py-3 tabular-nums">
                    {formatPrice(
                      filtered.reduce((sum, row) => sum + row.paidOut, 0),
                    )}
                  </td>
                  <td className="px-5 py-3 tabular-nums">
                    {formatPrice(
                      filtered.reduce((sum, row) => sum + row.feesCollected, 0),
                    )}
                  </td>
                </tr>
              </tfoot>
            ) : null}
          </table>
        </div>
        <AdminPagination
          page={pagination.page}
          pageSize={pagination.pageSize}
          total={pagination.total}
          totalPages={pagination.totalPages}
          start={pagination.start}
          end={pagination.end}
          onPageChange={pagination.onPageChange}
          onPageSizeChange={pagination.onPageSizeChange}
        />
      </section>
    </div>
  );
}
