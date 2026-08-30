import { CheckoutPayment } from "@/components/checkout-payment";
import { Container } from "@/components/container";
import { CultureIcon } from "@/components/culture-icons";
import { site } from "@/lib/site";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pay",
  description: `Choose MTN MoMo, Airtel Money, or card to complete your ${site.name} order.`,
  robots: { index: false },
};

const STEPS = [
  { href: "/cart", label: "Bag", icon: "pot" as const, current: false },
  { href: "/checkout", label: "Checkout", icon: "shield" as const, current: false },
  { href: "/checkout/pay", label: "Pay", icon: "spiral" as const, current: true },
];

export default function CheckoutPayPage() {
  return (
    <>
      <Container className="py-10 lg:py-14">
        <nav
          aria-label="Checkout progress"
          className="flex flex-wrap items-center gap-2 text-xs tracking-[0.14em] uppercase sm:gap-3"
        >
          {STEPS.map((step, index) => (
            <div key={step.label} className="flex items-center gap-2 sm:gap-3">
              {index > 0 && (
                <span aria-hidden className="text-bone-dim">
                  /
                </span>
              )}
              {step.current ? (
                <span
                  className="inline-flex items-center gap-1.5 text-coal"
                  aria-current="step"
                >
                  <CultureIcon name={step.icon} className="h-4 w-4 text-rust" />
                  {step.label}
                </span>
              ) : (
                <Link
                  href={step.href}
                  className="inline-flex items-center gap-1.5 text-bone-dim transition-colors hover:text-rust"
                >
                  <CultureIcon name={step.icon} className="h-4 w-4 text-rust" />
                  {step.label}
                </Link>
              )}
            </div>
          ))}
        </nav>

        <header className="mt-8 max-w-2xl">
          <p className="eyebrow">{site.madeIn}</p>
          <h1 className="font-display mt-2 text-5xl tracking-[0.03em] lg:text-6xl">
            Pay securely
          </h1>
          <p className="mt-4 text-base leading-relaxed text-bone-dim">
            Pick MTN MoMo, Airtel Money, or card · then confirm to finish your order.
          </p>
        </header>

        <CheckoutPayment />
      </Container>
    </>
  );
}
