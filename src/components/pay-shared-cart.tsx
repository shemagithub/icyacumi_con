"use client";

import { useEffect, useState } from "react";
import { CheckoutForm } from "@/components/checkout-form";
import { Container } from "@/components/container";
import { CultureIcon } from "@/components/culture-icons";
import { formatPrice } from "@/lib/format";
import type { CartLine, Size } from "@/lib/types";
import Link from "next/link";

type SharedPayload = {
  token: string;
  status: string;
  expiresAt: string;
  ownerName: string | null;
  message: string | null;
  lines: CartLine[];
  paidOrderId: string | null;
};

function normalizeLines(raw: unknown): CartLine[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((line) => {
      if (typeof line !== "object" || line === null) return null;
      const item = line as Record<string, unknown>;
      const productId = String(item.productId ?? "");
      const name = String(item.name ?? "");
      if (!productId || !name) return null;
      const image =
        item.image && typeof item.image === "object"
          ? {
              src: String((item.image as { src?: string }).src ?? "/brand/logo.png"),
              alt: String((item.image as { alt?: string }).alt ?? name),
            }
          : { src: "/brand/logo.png", alt: name };
      return {
        id: String(item.id ?? `${productId}:${item.size}:${item.color}`),
        productId,
        slug: String(item.slug ?? productId),
        name,
        price: Math.max(0, Math.round(Number(item.price) || 0)),
        size: String(item.size ?? "OS") as Size,
        color: String(item.color ?? "-"),
        image,
        quantity: Math.max(1, Math.min(99, Math.round(Number(item.quantity) || 1))),
        kind: item.kind === "ticket" ? ("ticket" as const) : ("product" as const),
      };
    })
    .filter((line): line is CartLine => line !== null);
}

export function PaySharedCart({ token }: { token: string }) {
  const [shared, setShared] = useState<SharedPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/catalog/shared-carts/${encodeURIComponent(token)}`,
          { cache: "no-store" },
        );
        const data = await response.json();
        if (!response.ok) {
          if (!cancelled) setError(data.error ?? "Shared bag not found.");
          return;
        }
        const cart = data.sharedCart as {
          token: string;
          status: string;
          expiresAt: string;
          ownerName: string | null;
          message: string | null;
          lines: unknown;
          paidOrderId: string | null;
        };
        if (!cancelled) {
          setShared({
            ...cart,
            lines: normalizeLines(cart.lines),
          });
        }
      } catch {
        if (!cancelled) setError("Could not load this shared bag.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading) {
    return (
      <Container className="py-16">
        <p className="text-sm text-bone-dim">Loading shared bag…</p>
      </Container>
    );
  }

  if (error || !shared) {
    return (
      <Container className="py-16">
        <div className="craft-panel mx-auto max-w-lg bg-bone/90 px-6 py-12 text-center">
          <CultureIcon name="pot" className="mx-auto h-8 w-8 text-rust" />
          <h1 className="font-display mt-4 text-3xl tracking-[0.04em]">
            Link unavailable
          </h1>
          <p className="mt-3 text-sm text-bone-dim">
            {error ?? "This shared bag could not be opened."}
          </p>
          <Link
            href="/shop"
            className="craft-btn mt-8 inline-block bg-rust px-6 py-3 text-xs tracking-[0.2em] text-bone uppercase"
          >
            Browse shop
          </Link>
        </div>
      </Container>
    );
  }

  if (shared.status === "paid") {
    return (
      <Container className="py-16">
        <div className="craft-panel mx-auto max-w-lg bg-bone/90 px-6 py-12 text-center">
          <CultureIcon name="sun" className="mx-auto h-8 w-8 text-rust" />
          <h1 className="font-display mt-4 text-3xl tracking-[0.04em]">
            Already paid
          </h1>
          <p className="mt-3 text-sm text-bone-dim">
            Someone already covered this bag. Track the delivery with the order
            reference from the receipt email.
          </p>
          <Link
            href="/track"
            className="craft-btn mt-8 inline-block bg-rust px-6 py-3 text-xs tracking-[0.2em] text-bone uppercase"
          >
            Track an order
          </Link>
        </div>
      </Container>
    );
  }

  if (shared.status === "expired" || shared.lines.length === 0) {
    return (
      <Container className="py-16">
        <div className="craft-panel mx-auto max-w-lg bg-bone/90 px-6 py-12 text-center">
          <CultureIcon name="spiral" className="mx-auto h-8 w-8 text-rust" />
          <h1 className="font-display mt-4 text-3xl tracking-[0.04em]">
            Link expired
          </h1>
          <p className="mt-3 text-sm text-bone-dim">
            Ask them to share their bag again from the cart page.
          </p>
        </div>
      </Container>
    );
  }

  const subtotal = shared.lines.reduce(
    (sum, line) => sum + line.price * line.quantity,
    0,
  );

  return (
    <Container className="py-10 lg:py-14">
      <header className="max-w-2xl">
        <p className="eyebrow">Gift checkout</p>
        <h1 className="font-display mt-2 text-5xl tracking-[0.03em] lg:text-6xl">
          Pay for this bag
        </h1>
        <p className="mt-4 text-base leading-relaxed text-bone-dim">
          {shared.ownerName
            ? `You’re covering ${shared.ownerName}’s order.`
            : "You’re covering a shared order."}{" "}
          No account required · enter your details and pay.
        </p>
        <p className="mt-2 text-sm text-bone-dim">
          {shared.lines.length} item{shared.lines.length === 1 ? "" : "s"} ·{" "}
          {formatPrice(subtotal)} before shipping
        </p>
      </header>

      <CheckoutForm
        overrideLines={shared.lines}
        sharedCartToken={shared.token}
        giftNote={shared.message}
        ownerName={shared.ownerName}
      />
    </Container>
  );
}
