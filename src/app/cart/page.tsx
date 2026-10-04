import type { Metadata } from "next";
import { CartGate } from "@/components/cart-gate";
import { Container } from "@/components/container";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Bag",
  description: `Your bag on ${site.name} · products and event tickets.`,
  robots: { index: false },
};

export default function CartPage() {
  return (
    <Container className="py-12 lg:py-16">
      <p className="eyebrow">{site.name}</p>
      <h1 className="font-display mt-2 text-5xl tracking-[0.03em] lg:text-6xl">
        Bag
      </h1>
      <p className="mt-3 max-w-xl text-sm text-bone-dim">
        Add products and tickets anytime. Sign in when you&rsquo;re ready to checkout.
      </p>
      <div className="mt-10">
        <CartGate />
      </div>
    </Container>
  );
}
