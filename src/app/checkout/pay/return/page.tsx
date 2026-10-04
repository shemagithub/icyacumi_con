import { CheckoutPaymentReturn } from "@/components/checkout-payment-return";
import { Container } from "@/components/container";
import { site } from "@/lib/site";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Confirming payment",
  robots: { index: false },
};

export default function CheckoutPayReturnPage() {
  return (
    <Container className="py-10 lg:py-14">
      <p className="eyebrow">{site.madeIn}</p>
      <Suspense
        fallback={
          <p className="mt-10 text-sm text-bone-dim" role="status">
            Confirming payment…
          </p>
        }
      >
        <CheckoutPaymentReturn />
      </Suspense>
    </Container>
  );
}
