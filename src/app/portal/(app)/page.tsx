"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { formatPrice } from "@/lib/format";

type RecentSale = {
  id: string;
  reference: string;
  name: string;
  kind: "product" | "ticket";
  lineTotal: number;
  brandKeeps: number;
  date: string;
  orderStatus: string;
  statusLabel: string;
};

type Dashboard = {
  productCount: number;
  eventCount: number;
  adCount: number;
  pendingPayout: number;
  available: number;
  totalEarned: number;
  salesGross: number;
  orderCount: number;
  recentSales: RecentSale[];
};

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function PortalDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const firstName = useMemo(() => {
    const name = user?.type === "brand" ? user.name : "there";
    return name.split(" ")[0] || "there";
  }, [user]);

  useEffect(() => {
    void (async () => {
      const response = await fetch("/api/portal/dashboard");
      const json = await response.json();
      if (!response.ok) {
        setError(json.error ?? "Could not load dashboard");
        return;
      }
      setData(json);
    })();
  }, []);

  if (error) {
    return <p className="text-sm text-[var(--portal-accent)]">{error}</p>;
  }

  if (!data) {
    return <p className="text-sm text-[var(--portal-muted)]">Loading dashboard…</p>;
  }

  const stats = [
    {
      label: "Available",
      value: formatPrice(data.available),
      hint: "Ready to withdraw",
      href: "/portal/payments",
      accent: true,
    },
    {
      label: "Gross sales",
      value: formatPrice(data.salesGross),
      hint: `${data.orderCount} paid order${data.orderCount === 1 ? "" : "s"}`,
      href: "/portal/sales",
      accent: false,
    },
    {
      label: "Products",
      value: String(data.productCount),
      hint: "Live catalog",
      href: "/portal/products",
      accent: false,
    },
    {
      label: "Pending payout",
      value: formatPrice(data.pendingPayout),
      hint: "Awaiting admin",
      href: "/portal/payments",
      accent: false,
    },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {greeting()}, {firstName}
        </h1>
        <p className="mt-1 text-sm text-[var(--portal-muted)]">
          Sales, stock, and payouts stay in sync with the marketplace admin.
        </p>
      </header>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <section className="portal-card p-5 sm:p-6">
          <p className="text-sm text-[var(--portal-muted)]">Available to withdraw</p>
          <p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            {formatPrice(data.available)}
          </p>
          <p className="mt-2 text-sm text-emerald-600">
            From paid sales after commission · earned {formatPrice(data.totalEarned)}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/portal/payments" className="portal-btn portal-btn--ink">
              Request payout
            </Link>
            <Link href="/portal/sales" className="portal-btn portal-btn--ghost">
              View sales
            </Link>
            <Link href="/portal/products" className="portal-btn portal-btn--ghost">
              Add product
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2">
            {[
              { label: "Catalog", value: data.productCount },
              { label: "Events", value: data.eventCount },
              { label: "Ads", value: data.adCount },
            ].map((wallet) => (
              <div
                key={wallet.label}
                className="rounded-2xl bg-[var(--portal-bg)] px-3 py-3"
              >
                <p className="text-[0.7rem] text-[var(--portal-muted)]">{wallet.label}</p>
                <p className="mt-1 text-lg font-semibold tabular-nums">{wallet.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3">
          {stats.map((stat) => (
            <Link
              key={`${stat.href}-${stat.label}`}
              href={stat.href}
              className={`portal-card flex flex-col justify-between p-4 transition-transform hover:-translate-y-0.5 ${
                stat.accent
                  ? "bg-[var(--portal-accent)] text-white border-transparent shadow-[0_12px_30px_rgba(255,92,53,0.28)]"
                  : ""
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p
                  className={`text-xs font-medium ${
                    stat.accent ? "text-white/80" : "text-[var(--portal-muted)]"
                  }`}
                >
                  {stat.label}
                </p>
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${
                    stat.accent ? "bg-white/20" : "bg-[var(--portal-bg)]"
                  }`}
                >
                  →
                </span>
              </div>
              <div className="mt-6">
                <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
                <p
                  className={`mt-1 text-xs ${
                    stat.accent ? "text-white/75" : "text-[var(--portal-muted)]"
                  }`}
                >
                  {stat.hint}
                </p>
              </div>
            </Link>
          ))}
        </section>
      </div>

      <section className="portal-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--portal-line)] px-5 py-4">
          <div>
            <p className="text-sm font-semibold">Recent sales</p>
            <p className="text-xs text-[var(--portal-muted)]">
              Live from paid orders · same data admin commission uses
            </p>
          </div>
          <Link href="/portal/sales" className="portal-btn portal-btn--ghost !py-2 !text-xs">
            All sales
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead>
              <tr className="text-xs text-[var(--portal-muted)]">
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-3 py-3 font-medium">Order</th>
                <th className="px-3 py-3 font-medium">Item</th>
                <th className="px-3 py-3 font-medium">You keep</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {(data.recentSales ?? []).map((row) => (
                <tr key={row.id} className="border-t border-[var(--portal-line)]">
                  <td className="px-5 py-3.5 text-[var(--portal-muted)] whitespace-nowrap">
                    {new Date(row.date).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </td>
                  <td className="px-3 py-3.5 font-medium tabular-nums">{row.reference}</td>
                  <td className="px-3 py-3.5">
                    {row.name}
                    <span className="mt-0.5 block text-xs capitalize text-[var(--portal-muted)]">
                      {row.kind}
                    </span>
                  </td>
                  <td className="px-3 py-3.5 font-semibold tabular-nums text-emerald-700">
                    {formatPrice(row.brandKeeps)}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="portal-badge portal-badge--info">
                      {row.statusLabel || row.orderStatus}
                    </span>
                  </td>
                </tr>
              ))}
              {(data.recentSales ?? []).length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-10 text-center text-sm text-[var(--portal-muted)]"
                  >
                    No sales yet. When a client buys your product or ticket, it shows here
                    and in Sales.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
