"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Container } from "@/components/container";
import { CultureIcon } from "@/components/culture-icons";
import { formatPrice } from "@/lib/format";

type TimelineStep = {
  key: string;
  label: string;
  at: string | null;
  state: "done" | "current" | "upcoming" | "idle";
};

type TrackedOrder = {
  reference: string;
  email: string;
  customerName: string;
  status: string;
  statusLabel: string;
  trackingCode: string | null;
  carrier: string | null;
  shippingAddress: string | null;
  total: number;
  currency: string;
  paidAt: string | null;
  timeline: TimelineStep[];
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    unitAmount: number;
    size: string;
    color: string;
  }>;
};

function formatWhen(iso: string | null) {
  if (!iso) return null;
  try {
    return new Intl.DateTimeFormat("en", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function TrackOrderView({
  reference,
  email,
}: {
  reference: string;
  email?: string;
}) {
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const query = email
          ? `?email=${encodeURIComponent(email)}`
          : "";
        const response = await fetch(
          `/api/catalog/orders/track/${encodeURIComponent(reference)}${query}`,
          { cache: "no-store" },
        );
        const data = await response.json();
        if (!response.ok) {
          if (!cancelled) setError(data.error ?? "Order not found.");
          return;
        }
        if (!cancelled) setOrder(data.order as TrackedOrder);
      } catch {
        if (!cancelled) setError("Could not load tracking.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reference, email]);

  if (loading) {
    return (
      <Container className="py-16">
        <p className="text-sm text-bone-dim">Loading tracking…</p>
      </Container>
    );
  }

  if (error || !order) {
    return (
      <Container className="py-16">
        <div className="craft-panel mx-auto max-w-lg bg-bone/90 px-6 py-12 text-center">
          <CultureIcon name="spiral" className="mx-auto h-8 w-8 text-rust" />
          <h1 className="font-display mt-4 text-3xl tracking-[0.04em]">
            Not found
          </h1>
          <p className="mt-3 text-sm text-bone-dim">
            {error ?? "We couldn’t find that order."}
          </p>
          <Link
            href="/track"
            className="craft-btn mt-8 inline-block bg-rust px-6 py-3 text-xs tracking-[0.2em] text-bone uppercase"
          >
            Try again
          </Link>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-12 lg:py-16">
      <header className="max-w-2xl">
        <p className="eyebrow">Delivery</p>
        <h1 className="font-display mt-2 text-5xl tracking-[0.03em]">
          {order.statusLabel}
        </h1>
        <p className="mt-3 text-sm text-bone-dim">
          Order{" "}
          <span className="font-semibold tracking-[0.08em] text-coal uppercase">
            {order.reference}
          </span>
          {" · "}
          {order.email}
        </p>
      </header>

      <ol className="craft-panel mt-10 max-w-2xl space-y-0 bg-bone/95 p-6 sm:p-8">
        {order.timeline.map((step, index) => (
          <li
            key={step.key}
            className={`relative flex gap-4 pb-8 last:pb-0 ${
              index < order.timeline.length - 1
                ? "before:absolute before:top-7 before:bottom-0 before:left-[0.7rem] before:w-px before:bg-ash-line"
                : ""
            }`}
          >
            <span
              className={`relative z-[1] mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[0.65rem] font-bold ${
                step.state === "done"
                  ? "border-rust bg-rust text-bone"
                  : step.state === "current"
                    ? "border-rust bg-bone text-rust"
                    : "border-ash-line bg-ash text-bone-dim"
              }`}
              aria-hidden
            >
              {step.state === "done" ? "✓" : index + 1}
            </span>
            <div>
              <p
                className={`text-sm font-semibold ${
                  step.state === "upcoming" ? "text-bone-dim" : "text-coal"
                }`}
              >
                {step.label}
              </p>
              {step.at ? (
                <p className="mt-0.5 text-xs text-bone-dim">
                  {formatWhen(step.at)}
                </p>
              ) : step.state === "current" ? (
                <p className="mt-0.5 text-xs text-rust">In progress</p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>

      {(order.trackingCode || order.carrier || order.shippingAddress) && (
        <div className="mt-8 max-w-2xl space-y-2 text-sm text-bone-dim">
          {order.carrier ? (
            <p>
              Carrier: <span className="text-coal">{order.carrier}</span>
            </p>
          ) : null}
          {order.trackingCode ? (
            <p>
              Tracking code:{" "}
              <span className="text-coal">{order.trackingCode}</span>
            </p>
          ) : null}
          {order.shippingAddress ? (
            <p>
              Ship to:{" "}
              <span className="text-coal">{order.shippingAddress}</span>
            </p>
          ) : null}
        </div>
      )}

      <div className="mt-10 max-w-2xl">
        <p className="eyebrow">Items</p>
        <ul className="mt-4 divide-y divide-ash-line border-y border-ash-line">
          {order.items.map((item) => (
            <li
              key={item.id}
              className="flex justify-between gap-4 py-3 text-sm"
            >
              <div>
                <p className="font-medium text-coal">{item.name}</p>
                <p className="text-xs text-bone-dim">
                  {item.color} / {item.size} · Qty {item.quantity}
                </p>
              </div>
              <p className="tabular-nums">
                {formatPrice(item.unitAmount * item.quantity, order.currency)}
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-4 flex justify-between text-base font-semibold">
          <span>Total</span>
          <span className="tabular-nums">
            {formatPrice(order.total, order.currency)}
          </span>
        </p>
      </div>

      <div className="mt-10 flex flex-wrap gap-4">
        <Link
          href="/track"
          className="text-xs tracking-[0.16em] text-bone-dim uppercase underline underline-offset-4 hover:text-rust"
        >
          Track another
        </Link>
        <Link
          href="/contact"
          className="text-xs tracking-[0.16em] text-bone-dim uppercase underline underline-offset-4 hover:text-rust"
        >
          Need help?
        </Link>
      </div>
    </Container>
  );
}
