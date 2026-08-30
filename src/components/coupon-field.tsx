"use client";

import { useState } from "react";
import type { AppliedCoupon, CheckoutDraftItem } from "@/lib/checkout-draft";
import { formatPrice } from "@/lib/format";

export function CouponField({
  items,
  applied,
  onApplied,
  onCleared,
}: {
  items: CheckoutDraftItem[];
  applied: AppliedCoupon | null;
  onApplied: (coupon: AppliedCoupon) => void;
  onCleared: () => void;
}) {
  const [code, setCode] = useState(applied?.code ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function applyCoupon() {
    const trimmed = code.trim();
    if (!trimmed) {
      setError("Enter a coupon code.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/catalog/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: trimmed,
          items: items.map((item) => ({
            productId: item.productId,
            size: item.size,
            color: item.color,
            quantity: item.quantity,
            kind: item.kind,
          })),
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error ?? "Coupon could not be applied.");
        return;
      }
      onApplied({
        code: String(data.coupon.code),
        couponId: String(data.coupon.id),
        type: String(data.coupon.type),
        discount: Number(data.discount) || 0,
        shipping: Number(data.shipping) || 0,
        total: Number(data.total) || 0,
        freeShipping: Boolean(data.freeShipping),
        description: data.coupon.description ?? null,
      });
      setCode(String(data.coupon.code));
    } catch {
      setError("Could not reach the server.");
    } finally {
      setPending(false);
    }
  }

  if (applied) {
    return (
      <div className="border border-paint-green/40 bg-paint-green/10 px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs tracking-[0.14em] text-paint-green uppercase">
              Coupon applied
            </p>
            <p className="mt-1 font-semibold tracking-[0.06em]">{applied.code}</p>
            <p className="mt-1 text-sm text-bone-dim">
              {applied.discount > 0
                ? `Saved ${formatPrice(applied.discount)}`
                : null}
              {applied.discount > 0 && applied.freeShipping ? " · " : null}
              {applied.freeShipping ? "Free shipping" : null}
              {!applied.discount && !applied.freeShipping
                ? applied.description || "Applied"
                : null}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setCode("");
              setError(null);
              onCleared();
            }}
            className="text-xs tracking-[0.12em] text-bone-dim uppercase underline hover:text-rust"
          >
            Remove
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block">
        <span className="eyebrow mb-2 block">Coupon code</span>
        <div className="flex gap-2">
          <input
            type="text"
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            className="field-input flex-1 uppercase tracking-[0.12em]"
            placeholder="WELCOME10"
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="button"
            disabled={pending}
            onClick={() => void applyCoupon()}
            className="craft-btn-ghost shrink-0 px-4 py-3 text-[0.65rem] tracking-[0.14em] uppercase disabled:opacity-60"
          >
            {pending ? "…" : "Apply"}
          </button>
        </div>
      </label>
      {error ? (
        <p role="alert" className="text-sm text-rust">
          {error}
        </p>
      ) : null}
    </div>
  );
}
