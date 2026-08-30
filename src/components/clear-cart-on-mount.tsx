"use client";

import { useEffect } from "react";
import { useCart } from "@/components/cart-provider";

/** Empties the bag once Stripe has sent the shopper back with a paid session. */
export function ClearCartOnMount() {
  const { clear, hydrated } = useCart();

  useEffect(() => {
    if (hydrated) clear();
  }, [hydrated, clear]);

  return null;
}
