"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Container } from "@/components/container";
import { useAuth } from "@/components/auth-provider";
import { CultureIcon } from "@/components/culture-icons";
import { formatPrice } from "@/lib/format";

type OrderRow = {
  reference: string;
  status: string;
  statusLabel: string;
  total: number;
  currency: string;
  createdAt: string;
  trackingCode: string | null;
  carrier: string | null;
  items: Array<{ name: string; quantity: number }>;
};

export default function AccountOrdersPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login?next=/account/orders");
      return;
    }
    if (user.type === "brand") router.replace("/portal");
    if (user.type === "admin") router.replace("/admin");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user || user.type !== "client") return;
    let cancelled = false;
    void (async () => {
      setFetching(true);
      try {
        const response = await fetch("/api/auth/orders", {
          credentials: "include",
          cache: "no-store",
        });
        const data = await response.json();
        if (!response.ok) {
          if (!cancelled) setError(data.error ?? "Could not load orders.");
          return;
        }
        if (!cancelled) setOrders((data.orders as OrderRow[]) ?? []);
      } catch {
        if (!cancelled) setError("Could not reach the server.");
      } finally {
        if (!cancelled) setFetching(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (loading || !user || user.type !== "client") {
    return (
      <Container className="py-20">
        <p className="text-sm text-bone-dim">Loading orders…</p>
      </Container>
    );
  }

  return (
    <Container className="py-12 lg:py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Account</p>
          <h1 className="font-display mt-2 text-5xl tracking-[0.03em]">
            Orders
          </h1>
          <p className="mt-3 text-sm text-bone-dim">
            Track delivery for every purchase tied to your account or email.
          </p>
        </div>
        <Link
          href="/track"
          className="text-xs tracking-[0.16em] text-bone-dim uppercase underline underline-offset-4 hover:text-rust"
        >
          Track by reference
        </Link>
      </div>

      {fetching ? (
        <p className="mt-10 text-sm text-bone-dim">Loading…</p>
      ) : error ? (
        <p className="mt-10 text-sm text-rust">{error}</p>
      ) : orders.length === 0 ? (
        <div className="craft-panel mt-10 bg-bone/90 px-6 py-14 text-center">
          <CultureIcon name="pot" className="mx-auto h-8 w-8 text-rust" />
          <p className="font-display mt-4 text-2xl tracking-[0.04em]">
            No orders yet
          </p>
          <Link
            href="/shop"
            className="craft-btn mt-6 inline-block bg-rust px-6 py-3 text-xs tracking-[0.2em] text-bone uppercase"
          >
            Start shopping
          </Link>
        </div>
      ) : (
        <ul className="mt-10 divide-y divide-ash-line border-y border-ash-line">
          {orders.map((order) => (
            <li
              key={order.reference}
              className="flex flex-wrap items-center justify-between gap-4 py-5"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold tracking-[0.06em] text-coal uppercase">
                    {order.reference}
                  </p>
                  <span className="rounded-full bg-ash/70 px-2.5 py-0.5 text-[0.65rem] font-semibold tracking-[0.08em] text-coal uppercase">
                    {order.statusLabel}
                  </span>
                </div>
                <p className="mt-1 text-sm text-bone-dim">
                  {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
                    new Date(order.createdAt),
                  )}
                </p>
                <p className="mt-1 text-xs text-bone-dim">
                  {order.items
                    .slice(0, 3)
                    .map((item) => `${item.name} ×${item.quantity}`)
                    .join(" · ")}
                  {order.items.length > 3 ? "…" : ""}
                </p>
                {order.trackingCode || order.carrier ? (
                  <p className="mt-2 text-xs text-coal">
                    {order.carrier ? `${order.carrier} · ` : ""}
                    {order.trackingCode ?? "Tracking pending"}
                  </p>
                ) : null}
              </div>
              <div className="flex items-center gap-4">
                <p className="tabular-nums text-sm font-semibold">
                  {formatPrice(order.total, order.currency)}
                </p>
                <Link
                  href={`/track/${encodeURIComponent(order.reference)}?email=${encodeURIComponent(user.email)}`}
                  className="craft-btn-ghost px-4 py-2 text-[0.65rem] tracking-[0.14em] uppercase"
                >
                  Track
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
