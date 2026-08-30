"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CultureIcon } from "@/components/culture-icons";
import { CouponField } from "@/components/coupon-field";
import { useCart } from "@/components/cart-provider";
import {
  clearCheckoutDraft,
  PAYMENT_METHODS,
  paymentMethodLabel,
  readCheckoutDraft,
  saveCheckoutDraft,
  type AppliedCoupon,
  type CheckoutDraft,
  type PaymentMethodId,
} from "@/lib/checkout-draft";
import { clearBuyNowLines } from "@/lib/buy-now";
import { formatPrice } from "@/lib/format";
import { site } from "@/lib/site";

export function CheckoutPayment() {
  const router = useRouter();
  const cart = useCart();
  const [draft, setDraft] = useState<CheckoutDraft | null>(null);
  const [ready, setReady] = useState(false);
  const [method, setMethod] = useState<PaymentMethodId | null>(null);
  const [phone, setPhone] = useState("");
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [waitingPrompt, setWaitingPrompt] = useState(false);

  useEffect(() => {
    const loaded = readCheckoutDraft();
    setDraft(loaded);
    if (loaded?.customer.phone) setPhone(loaded.customer.phone);
    if (loaded?.coupon) setCoupon(loaded.coupon);
    setReady(true);
  }, []);

  function persistCoupon(next: AppliedCoupon | null) {
    setCoupon(next);
    if (!draft) return;
    const updated = { ...draft, coupon: next };
    setDraft(updated);
    saveCheckoutDraft(updated);
  }

  const summaryLines = useMemo(() => {
    if (!draft) return [];
    return draft.items.map((item) => ({
      id: `${item.productId}-${item.size}-${item.color}`,
      name: item.name ?? "Item",
      quantity: item.quantity,
      price: item.price ?? 0,
      slug: item.slug,
      kind: item.kind,
      color: item.color,
      size: item.size,
      imageSrc: item.imageSrc,
    }));
  }, [draft]);

  const subtotal = summaryLines.reduce(
    (sum, line) => sum + line.price * line.quantity,
    0,
  );
  const shipping =
    coupon != null
      ? coupon.shipping
      : summaryLines.length === 0 || subtotal >= site.freeShippingThreshold
        ? 0
        : site.shippingRate;
  const discount = coupon?.discount ?? 0;
  const total =
    coupon != null ? coupon.total : Math.max(0, subtotal - discount + shipping);

  const selected = PAYMENT_METHODS.find((entry) => entry.id === method) ?? null;

  async function completeMobileOrDemo(paymentMethod: PaymentMethodId) {
    if (!draft) return;
    const customer = {
      ...draft.customer,
      phone: phone.trim() || draft.customer.phone,
    };

    if (draft.sharedCartToken) {
      const response = await fetch("/api/orders/complete-shared", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: draft.sharedCartToken,
          customer,
          paymentMethod,
          couponCode: coupon?.code,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Could not complete payment.");
      }
      clearCheckoutDraft();
      clearBuyNowLines();
      window.location.href = `/checkout/success?ref=${encodeURIComponent(data.order.reference)}`;
      return;
    }

    const response = await fetch("/api/orders/complete-demo", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: draft.items.map((item) => ({
          productId: item.productId,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
          kind: item.kind,
        })),
        customer,
        paymentMethod,
        couponCode: coupon?.code,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error ?? "Could not complete payment.");
    }
    clearCheckoutDraft();
    clearBuyNowLines();
    if (!draft.buyNow) {
      cart.clear();
    }
    window.location.href = `/checkout/success?ref=${encodeURIComponent(data.order.reference)}`;
  }

  async function payWithCard() {
    if (!draft) return;
    const response = await fetch("/api/checkout", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: draft.items.map((item) => ({
          productId: item.productId,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
          kind: item.kind,
        })),
        customer: draft.customer,
        sharedCartToken: draft.sharedCartToken || undefined,
        couponCode: coupon?.code,
      }),
    });
    const data: {
      url?: string;
      error?: string;
      demoAvailable?: boolean;
    } = await response.json();

    if (response.ok && data.url) {
      const wasBuyNow = Boolean(draft.buyNow);
      clearCheckoutDraft();
      clearBuyNowLines();
      if (!wasBuyNow) {
        cart.clear();
      }
      window.location.href = data.url;
      return;
    }

    if (response.status === 503 && data.demoAvailable) {
      await completeMobileOrDemo("card");
      return;
    }

    throw new Error(data.error ?? "Card checkout is unavailable right now.");
  }

  async function onPay() {
    if (!draft || !method) {
      setError("Select a payment option to continue.");
      return;
    }
    if (selected?.needsPhone && phone.trim().length < 8) {
      setError("Enter the mobile money phone number (at least 8 digits).");
      return;
    }

    setPending(true);
    setError(null);
    try {
      if (method === "card") {
        await payWithCard();
        return;
      }

      setWaitingPrompt(true);
      await new Promise((resolve) => setTimeout(resolve, 1600));
      await completeMobileOrDemo(method);
    } catch (err) {
      setWaitingPrompt(false);
      setError(err instanceof Error ? err.message : "Payment failed.");
    } finally {
      setPending(false);
    }
  }

  if (!ready) {
    return (
      <div className="mt-10 h-72 animate-pulse bg-ash" aria-busy>
        <span className="sr-only">Loading payment…</span>
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="craft-panel mt-10 bg-bone/80 px-6 py-16 text-center">
        <CultureIcon name="shield" className="mx-auto h-10 w-10 text-rust" />
        <p className="font-display mt-6 text-2xl tracking-[0.05em]">
          Start from checkout
        </p>
        <p className="mt-3 text-sm text-bone-dim">
          Fill in your contact and shipping details first, then choose how to pay.
        </p>
        <Link
          href="/checkout"
          className="craft-btn mt-8 inline-block bg-rust px-8 py-4 text-xs tracking-[0.2em] text-bone uppercase"
        >
          Back to checkout
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-10 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
      <div className="space-y-8">
        <section className="craft-panel bg-bone/95 p-6 sm:p-8">
          <p className="eyebrow">Shipping to</p>
          <p className="font-display mt-2 text-2xl tracking-[0.04em]">
            {draft.customer.name}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-bone-dim">
            {[
              draft.customer.line1,
              draft.customer.line2,
              draft.customer.city,
              draft.customer.state,
              draft.customer.postalCode,
              draft.customer.country,
            ]
              .filter(Boolean)
              .join(", ")}
          </p>
          <p className="mt-2 text-sm text-bone-dim">{draft.customer.email}</p>
          <Link
            href="/checkout"
            className="mt-4 inline-block text-xs tracking-[0.14em] text-bone-dim uppercase underline underline-offset-4 hover:text-rust"
          >
            Edit address
          </Link>
        </section>

        <section className="craft-panel bg-bone/95 p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <CultureIcon name="spiral" className="h-5 w-5 text-rust" />
            <div>
              <p className="eyebrow">Payment</p>
              <h2 className="font-display text-2xl tracking-[0.05em]">
                Select payment option
              </h2>
            </div>
          </div>
          <p className="mt-3 text-sm text-bone-dim">
            Choose MTN MoMo, Airtel Money, or card to finish your order.
          </p>

          <div className="mt-6">
            <CouponField
              items={draft.items}
              applied={coupon}
              onApplied={(next) => persistCoupon(next)}
              onCleared={() => persistCoupon(null)}
            />
          </div>

          <div className="mt-6 space-y-3" role="radiogroup" aria-label="Payment method">
            {PAYMENT_METHODS.map((entry) => {
              const active = method === entry.id;
              return (
                <button
                  key={entry.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => {
                    setMethod(entry.id);
                    setError(null);
                  }}
                  className={`w-full border px-4 py-4 text-left transition-colors ${
                    active
                      ? "border-rust bg-rust/5"
                      : "border-ash-line bg-bone hover:border-coal/40"
                  }`}
                >
                  <span className="flex items-start justify-between gap-3">
                    <span>
                      <span className="block text-sm font-semibold tracking-[0.04em] uppercase">
                        {entry.label}
                      </span>
                      <span className="mt-1 block text-sm text-bone-dim">
                        {entry.description}
                      </span>
                    </span>
                    <span
                      aria-hidden
                      className={`mt-1 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                        active ? "border-rust bg-rust" : "border-ash-line"
                      }`}
                    >
                      {active ? (
                        <span className="h-1.5 w-1.5 rounded-full bg-bone" />
                      ) : null}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {selected?.needsPhone ? (
            <label className="mt-6 block">
              <span className="eyebrow mb-2 block">
                {selected.label} phone number
              </span>
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                required
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="field-input"
                placeholder="07xxxxxxxx"
              />
              <span className="mt-2 block text-xs text-bone-dim">
                You’ll get a prompt on this number to approve the payment.
              </span>
            </label>
          ) : null}

          {waitingPrompt ? (
            <p
              role="status"
              className="mt-6 border border-coal/15 bg-ash/40 px-4 py-3 text-sm text-coal"
            >
              Waiting for approval on {paymentMethodLabel(method!)}…
              Confirm the prompt on your phone.
            </p>
          ) : null}

          {error ? (
            <p role="alert" className="mt-6 border border-rust/50 p-4 text-sm text-rust">
              {error}
            </p>
          ) : null}

          <button
            type="button"
            disabled={pending || !method}
            onClick={() => void onPay()}
            className="craft-btn mt-8 w-full bg-rust px-6 py-4 text-xs tracking-[0.2em] text-bone uppercase disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending
              ? method === "card"
                ? "Opening secure card pay…"
                : "Processing…"
              : method
                ? `Pay with ${paymentMethodLabel(method)}`
                : "Select a payment option"}
          </button>
        </section>
      </div>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="craft-panel bg-bone/95 p-6 sm:p-8">
          <p className="eyebrow">Your order</p>
          <h2 className="font-display mt-2 text-2xl tracking-[0.05em]">Summary</h2>
          <ul className="mt-6 divide-y divide-ash-line border-y border-ash-line">
            {summaryLines.map((line) => (
              <li key={line.id} className="flex gap-4 py-4">
                <div className="craft-frame craft-frame--soft relative aspect-[4/5] w-16 shrink-0 overflow-hidden bg-ash">
                  {line.imageSrc ? (
                    <Image
                      src={line.imageSrc}
                      alt={line.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-base tracking-[0.04em]">{line.name}</p>
                  <p className="mt-1 text-[0.65rem] tracking-[0.14em] text-bone-dim uppercase">
                    {line.kind === "ticket"
                      ? `Ticket · Qty ${line.quantity}`
                      : `${line.color} / ${line.size} · Qty ${line.quantity}`}
                  </p>
                  {line.price > 0 ? (
                    <p className="mt-2 text-sm tabular-nums">
                      {formatPrice(line.price * line.quantity)}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-bone-dim">Subtotal</dt>
              <dd className="tabular-nums">{formatPrice(subtotal)}</dd>
            </div>
            {discount > 0 ? (
              <div className="flex justify-between text-paint-green">
                <dt>Discount{coupon ? ` (${coupon.code})` : ""}</dt>
                <dd className="tabular-nums">−{formatPrice(discount)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between">
              <dt className="text-bone-dim">Shipping</dt>
              <dd className="tabular-nums">
                {shipping === 0 ? "Free" : formatPrice(shipping)}
              </dd>
            </div>
          </dl>
          <div className="mt-4 flex justify-between border-t border-ash-line pt-4 text-lg">
            <span>Total</span>
            <span className="tabular-nums">{formatPrice(total)}</span>
          </div>
          <button
            type="button"
            onClick={() => router.push("/checkout")}
            className="mt-6 block w-full text-center text-xs tracking-[0.16em] text-bone-dim uppercase underline underline-offset-4 hover:text-rust"
          >
            Back to checkout
          </button>
        </div>
      </aside>
    </div>
  );
}
