import { CheckoutGate } from "@/components/checkout-gate";
import { Container } from "@/components/container";
import { CultureIcon } from "@/components/culture-icons";
import { site } from "@/lib/site";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Checkout",
  description: `Complete your ${site.name} order. ${site.positioning}`,
  robots: { index: false },
};

const STEPS = [
  { href: "/cart", label: "Bag", icon: "pot" as const, current: false },
  { href: "/checkout", label: "Checkout", icon: "shield" as const, current: true },
  { href: "/checkout/pay", label: "Pay", icon: "spiral" as const, current: false },
];

export default function CheckoutPage() {
  return (
    <>
      <Container className="py-10 lg:py-14">
        <nav aria-label="Checkout progress" className="flex flex-wrap items-center gap-2 text-xs tracking-[0.14em] uppercase sm:gap-3">
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
            Checkout
          </h1>
          <p className="mt-4 text-base leading-relaxed text-bone-dim">
            Confirm contact and shipping, then choose MoMo, Airtel Money, or card.
          </p>
        </header>

        <CheckoutGate />
      </Container>
      <Container className="py-12 lg:py-16">
        <div className="grid gap-8 sm:grid-cols-3">
          <aside className="craft-panel bg-ash/40 p-6">
            <CultureIcon name="cloth" className="h-5 w-5 text-rust" />
            <p className="font-display mt-4 text-lg tracking-[0.06em]">Fit check</p>
            <p className="mt-2 text-sm leading-relaxed text-bone-dim">
              Unsure on size?{" "}
              <Link href="/sizing" className="text-coal underline decoration-rust/50 underline-offset-4 hover:text-rust">
                Read the guide
              </Link>{" "}
              before you pay.
            </p>
          </aside>
          <aside className="craft-panel bg-ash/40 p-6">
            <CultureIcon name="drum" className="h-5 w-5 text-rust" />
            <p className="font-display mt-4 text-lg tracking-[0.06em]">Need help?</p>
            <p className="mt-2 text-sm leading-relaxed text-bone-dim">
              Write{" "}
              <a
                href={`mailto:${site.email}`}
                className="text-coal underline decoration-rust/50 underline-offset-4 hover:text-rust"
              >
                {site.email}
              </a>{" "}
              · we answer order notes with care.
            </p>
          </aside>
          <aside className="craft-panel bg-ash/40 p-6">
            <CultureIcon name="hut" className="h-5 w-5 text-rust" />
            <p className="font-display mt-4 text-lg tracking-[0.06em]">{site.madeIn}</p>
            <p className="mt-2 text-sm leading-relaxed text-bone-dim">{site.positioning}</p>
          </aside>
        </div>
      </Container>
    </>
  );
}
