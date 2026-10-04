"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CultureIcon } from "@/components/culture-icons";
import { useCart } from "@/components/cart-provider";
import { readPaymentRef } from "@/lib/checkout-draft";
import { finishPaidCheckout, pollXentriPayStatus } from "@/lib/xentripay-checkout";

export function CheckoutPaymentReturn() {
  const searchParams = useSearchParams();
  const cart = useCart();
  const cartRef = useRef(cart);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  useEffect(() => {
    const ref = searchParams.get("ref")?.trim() || readPaymentRef();
    if (!ref) {
      setError("Missing payment reference. Go back to checkout and try again.");
      return;
    }

    let cancelled = false;
    pollXentriPayStatus(ref)
      .then((order) => {
        if (cancelled) return;
        finishPaidCheckout(order, cartRef.current);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Payment could not be confirmed.");
      });

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  return (
    <div className="craft-panel mx-auto mt-10 max-w-xl bg-bone/90 px-6 py-14 text-center sm:px-10">
      <CultureIcon name="spiral" className="mx-auto h-10 w-10 text-rust" />
      <p className="eyebrow mt-6">XentriPay</p>
      <h1 className="font-display mt-3 text-4xl tracking-[0.03em] lg:text-5xl">
        {error ? "Payment not confirmed" : "Confirming payment"}
      </h1>
      {error ? (
        <>
          <p role="alert" className="mt-6 text-sm leading-relaxed text-rust">
            {error}
          </p>
          <Link
            href="/checkout/pay"
            className="craft-btn mt-8 inline-block bg-rust px-8 py-4 text-xs tracking-[0.2em] text-bone uppercase"
          >
            Back to payment
          </Link>
        </>
      ) : (
        <p className="mt-6 text-sm leading-relaxed text-bone-dim" role="status">
          Checking XentriPay for a successful collection. Keep this page open.
        </p>
      )}
    </div>
  );
}
