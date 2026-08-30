"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
};

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

  if (error) return <p className="text-sm text-[var(--portal-accent)]">{error}</p>;
  if (!data) return <p className="text-sm text-[var(--portal-muted)]">Loading…</p>;

  const cards = [
    { label: "Brands", value: data.brandCount, href: "/admin/brands", accent: true },
    { label: "Clients", value: data.clientCount, href: "/admin/clients", accent: false },
    {
      label: "Gross sales",
      value: formatPrice(data.salesGross ?? 0),
      href: "/admin/settings",
      accent: false,
    },
    {
      label: "Your commission",
      value: formatPrice(data.platformCommissionAvailable ?? data.platformCommission ?? 0),
      href: "/admin/payouts",
      accent: false,
    },
    {
      label: "Commission earned",
      value: formatPrice(data.platformCommission ?? 0),
      href: "/admin/settings",
      accent: false,
    },
    {
      label: "Orders",
      value: String(data.orderCount ?? 0),
      href: "/admin/orders",
      accent: false,
    },
    {
      label: "Pending payouts",
      value: formatPrice(data.pendingPayout),
      href: "/admin/payouts",
      accent: false,
    },
    { label: "Products", value: data.productCount, href: "/admin/products", accent: false },
    { label: "Events", value: data.eventCount, href: "/admin/events", accent: false },
    {
      label: "Selling brands",
      value: String(data.sellingBrandCount ?? 0),
      href: "/admin/settings",
      accent: false,
    },
    {
      label: "Product commission",
      value: `${data.productCommissionPercent ?? 10}%`,
      href: "/admin/settings",
      accent: false,
    },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Marketplace control</h1>
        <p className="mt-1 text-sm text-[var(--portal-muted)]">
          Brands sell · you set commission · payouts and orders stay linked in RWF.
        </p>
      </header>

      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <li key={card.href}>
            <Link
              href={card.href}
              className={`portal-card block p-5 transition-transform hover:-translate-y-0.5 ${
                card.accent
                  ? "border-transparent bg-[var(--portal-accent)] text-white shadow-[0_12px_30px_rgba(255,92,53,0.28)]"
                  : ""
              }`}
            >
              <p
                className={`text-xs font-medium ${
                  card.accent ? "text-white/80" : "text-[var(--portal-muted)]"
                }`}
              >
                {card.label}
              </p>
              <p className="mt-3 text-3xl font-bold tracking-tight">{card.value}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
