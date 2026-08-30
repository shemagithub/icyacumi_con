"use client";

import { CartContents } from "@/components/cart-contents";
import { RequireClient } from "@/components/require-client";

export function CartGate() {
  return (
    <RequireClient message="Log in as a client to use your bag and checkout.">
      <CartContents />
    </RequireClient>
  );
}
