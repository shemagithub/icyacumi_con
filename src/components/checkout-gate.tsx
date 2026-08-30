"use client";

import { useEffect, useState } from "react";
import { CheckoutForm } from "@/components/checkout-form";
import { RequireClient } from "@/components/require-client";
import { readBuyNowLines } from "@/lib/buy-now";
import type { CartLine } from "@/lib/types";

export function CheckoutGate() {
  const [buyNowLines, setBuyNowLines] = useState<CartLine[] | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setBuyNowLines(readBuyNowLines());
    setReady(true);
  }, []);

  return (
    <RequireClient message="Log in as a client to complete checkout.">
      {ready ? (
        <CheckoutForm
          overrideLines={buyNowLines ?? undefined}
          buyNow={Boolean(buyNowLines?.length)}
        />
      ) : (
        <p className="mt-10 text-sm text-bone-dim">Loading checkout…</p>
      )}
    </RequireClient>
  );
}
