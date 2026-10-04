"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AdminBarChart,
  AdminDonutChart,
  AdminLineChart,
  type ChartPoint,
} from "@/components/admin-charts";
import { AdminSystemStatus } from "@/components/admin-system-status";
import { formatPrice } from "@/lib/format";

type Dashboard = {
  brandCount: number;
  clientCount: number;
  productCount: number;
  eventCount: number;
  adCount: number;
  pendingPayout: number;
  adminCount: number;
  orderCount?: number;
  salesGross?: number;
  platformCommission?: number;
  platformCommissionAvailable?: number;
  platformCommissionPaidOut?: number;
  platformCommissionPending?: number;
  sellingBrandCount?: number;
  productCommissionPercent?: number;
  ticketCommissionPercent?: number;
  charts?: {
    salesByWeek: ChartPoint[];
    brands: ChartPoint[];
    mix: ChartPoint[];
    split: ChartPoint[];
    commission: ChartPoint[];
    marketplace: ChartPoint[];
    catalog: ChartPoint[];
  };
};

type StatTone = "default" | "accent" | "ink";

type StatCard = {
  label: string;
  value: string | number;
  href: string;
  hint: string;
  tone?: StatTone;
};

function StatLink({ card }: { card: StatCard }) {
  const tone = card.tone ?? "default";
  return (
    <li>
      <Link
        href={card.href}
        className={`admin-stat-card ${
          tone === "accent" ? "admin-stat-card--accent" : tone === "ink" ? "admin-stat-card--ink" : ""
        }`}
      >
        <p
          className={`text-xs font-semibold tracking-[0.08em] uppercase ${
            tone === "default" ? "text-[var(--portal-muted)]" : "text-white/75"
          }`}
        >
          {card.label}
        </p>
        <p className="mt-3 text-3xl font-bold tracking-tight tabular-nums">{card.value}</p>
        <p
          className={`mt-auto pt-3 text-xs leading-5 ${
            tone === "default" ? "text-[var(--portal-muted)]" : "text-white/80"
          }`}
        >
          {card.hint}
        </p>
      </Link>
    </li>
  );
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const response = await fetch("/api/admin/dashboard", { credentials: "include" });
      const json = await response.json();
      if (!response.ok) {
        setError(json.error ?? "Could not load dashboard");
        return;
      }
      setData(json);
    })();
  }, []);

  if (error) {
    return (
      <p className="portal-card px-5 py-4 text-sm text-[var(--portal-accent)]">{error}</p>
    );
  }
  if (!data) {
    return <p className="text-sm text-[var(--portal-muted)]">Loading marketplace totals…</p>;
  }

  const money: StatCard[] = [
    {
      label: "Gross sales",
      value: formatPrice(data.salesGross ?? 0),
      href: "/admin/money",
      hint: "All brand product and ticket sales",
      tone: "ink",
    },
    {
      label: "Your commission",
      value: formatPrice(data.platformCommissionAvailable ?? data.platformCommission ?? 0),
      href: "/admin/payouts",
      hint: "Available platform cut in RWF",
      tone: "accent",
    },
    {
      label: "Commission earned",
      value: formatPrice(data.platformCommission ?? 0),
      href: "/admin/money",
      hint: "Total earned, including paid and pending",
    },
    {
      label: "Pending brand payouts",
      value: formatPrice(data.pendingPayout),
      href: "/admin/payouts",
      hint: "Waiting for you to send to brands",
    },
  ];

  const marketplace: StatCard[] = [
    {
      label: "Brands",
      value: data.brandCount,
      href: "/admin/brands",
      hint: "Approve, invite, and manage stores",
    },
    {
      label: "Clients",
      value: data.clientCount,
      href: "/admin/clients",
      hint: "Shopper accounts on the storefront",
    },
    {
      label: "Selling brands",
      value: String(data.sellingBrandCount ?? 0),
      href: "/admin/money",
      hint: "Brands with at least one paid sale",
    },
    {
      label: "Super admins",
      value: data.adminCount,
      href: "/admin/admins",
      hint: "People who can run this panel",
    },
  ];

  const catalog: StatCard[] = [
    {
      label: "Orders",
      value: String(data.orderCount ?? 0),
      href: "/admin/orders",
      hint: "Open and completed marketplace orders",
    },
    {
      label: "Products",
      value: data.productCount,
      href: "/admin/products",
      hint: "Listings across every brand",
    },
    {
      label: "Events",
      value: data.eventCount,
      href: "/admin/events",
      hint: "Ticketed events you create and assign",
    },
    {
      label: "Ads",
      value: data.adCount,
      href: "/admin/ads",
      hint: "Homepage and board placements",
    },
  ];

  const rates: StatCard[] = [
    {
      label: "Product commission",
      value: `${data.productCommissionPercent ?? 10}%`,
      href: "/admin/settings",
      hint: "Taken from each product sale",
    },
    {
      label: "Ticket commission",
      value: `${data.ticketCommissionPercent ?? 5}%`,
      href: "/admin/settings",
      hint: "Taken from each ticket sale",
    },
    {
      label: "Paid out",
      value: formatPrice(data.platformCommissionPaidOut ?? 0),
      href: "/admin/payouts",
      hint: "Commission you already withdrew",
    },
    {
      label: "Coupons",
      value: "Manage",
      href: "/admin/coupons",
      hint: "Discounts applied at checkout",
    },
  ];

  return (
    <div className="space-y-8">
      <header className="max-w-2xl">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Marketplace control</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--portal-muted)]">
          Totals stay in RWF. Graphs use live paid orders. Each card opens the page where you act
          on it — payouts, approvals, listings, or commission rates.
        </p>
      </header>

      <AdminSystemStatus />

      {data.charts ? (
        <section>
          <h2 className="admin-section-title">Graphs</h2>
          <div className="admin-chart-grid">
            <AdminLineChart
              title="Sales this stretch"
              hint="Paid orders by week · last 8 weeks"
              points={data.charts.salesByWeek}
              money
            />
            <AdminDonutChart
              title="Where the money goes"
              hint="Brand keep vs platform cut"
              points={data.charts.split}
              money
            />
            <AdminBarChart
              title="Sales by brand"
              hint="Top selling stores on the floor"
              points={data.charts.brands}
              money
            />
            <AdminDonutChart
              title="Your commission"
              hint="Available, pending, and already withdrawn"
              points={data.charts.commission}
              money
            />
            <AdminBarChart
              title="Product vs tickets"
              hint="Gross from listings and events"
              points={data.charts.mix}
              money
            />
            <AdminBarChart
              title="Catalog pulse"
              hint="Orders, products, events, and ads"
              points={data.charts.catalog}
            />
          </div>
        </section>
      ) : null}

      <section>
        <h2 className="admin-section-title">Money</h2>
        <ul className="admin-stat-grid">
          {money.map((card) => (
            <StatLink key={card.label} card={card} />
          ))}
        </ul>
      </section>

      <section>
        <h2 className="admin-section-title">Marketplace</h2>
        <ul className="admin-stat-grid">
          {marketplace.map((card) => (
            <StatLink key={card.label} card={card} />
          ))}
        </ul>
      </section>

      <section>
        <h2 className="admin-section-title">Catalog & orders</h2>
        <ul className="admin-stat-grid">
          {catalog.map((card) => (
            <StatLink key={card.label} card={card} />
          ))}
        </ul>
      </section>

      <section>
        <h2 className="admin-section-title">Rates & tools</h2>
        <ul className="admin-stat-grid">
          {rates.map((card) => (
            <StatLink key={card.label} card={card} />
          ))}
        </ul>
      </section>
    </div>
  );
}
