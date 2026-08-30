import type { Metadata } from "next";
import Link from "next/link";
import { ClearCartOnMount } from "@/components/clear-cart-on-mount";
import { Container } from "@/components/container";
import { CultureIcon } from "@/components/culture-icons";
import { SendOrderReceipt } from "@/components/send-order-receipt";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Order confirmed",
  robots: { index: false },
};

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const sessionId = params.session_id;
  const sessionIdValue = typeof sessionId === "string" ? sessionId : undefined;
  const refParam = params.ref;
  const orderRef = typeof refParam === "string" ? refParam.trim() : undefined;

  return (
    <>
      <ClearCartOnMount />

      <Container className="py-16 lg:py-24">
        <div className="craft-panel mx-auto max-w-xl bg-bone/90 px-6 py-14 text-center sm:px-10">
          <CultureIcon name="sun" className="mx-auto h-10 w-10 text-rust" />
          <p className="eyebrow mt-6">Thank you</p>
          <h1 className="font-display mt-3 text-5xl tracking-[0.03em] lg:text-6xl">
            Order confirmed
          </h1>
          <p className="mt-6 text-base leading-relaxed text-bone-dim">
            A receipt is on its way to your inbox. Each brand on your order also
            gets a sale notice. Follow delivery progress anytime with your order
            reference.
          </p>

          {orderRef ? (
            <p className="mt-6 text-sm text-bone-dim">
              Reference:{" "}
              <Link
                href={`/track/${encodeURIComponent(orderRef)}`}
                className="font-semibold tracking-[0.08em] text-coal uppercase underline underline-offset-4 hover:text-rust"
              >
                {orderRef}
              </Link>
            </p>
          ) : sessionIdValue ? (
            <>
              <p className="mt-6 text-xs tracking-[0.14em] text-bone-dim uppercase">
                Session:{" "}
                <span className="text-coal">{sessionIdValue.slice(-12)}</span>
              </p>
              <SendOrderReceipt sessionId={sessionIdValue} />
            </>
          ) : null}

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            {orderRef ? (
              <Link
                href={`/track/${encodeURIComponent(orderRef)}`}
                className="craft-btn inline-block bg-rust px-8 py-4 text-xs tracking-[0.2em] text-bone uppercase transition-colors hover:bg-sand"
              >
                Track delivery
              </Link>
            ) : (
              <Link
                href="/track"
                className="craft-btn inline-block bg-rust px-8 py-4 text-xs tracking-[0.2em] text-bone uppercase transition-colors hover:bg-sand"
              >
                Track an order
              </Link>
            )}
            <Link
              href="/shop"
              className="text-xs tracking-[0.16em] text-bone-dim uppercase underline underline-offset-4 hover:text-rust"
            >
              Keep shopping
            </Link>
          </div>
        </div>
      </Container>
      <Container className="py-12 text-center">
        <p className="eyebrow">{site.madeIn}</p>
        <p className="mt-3 text-sm text-bone-dim">{site.positioning}</p>
      </Container>
    </>
  );
}
