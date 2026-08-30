import type { Metadata } from "next";
import { PaySharedCart } from "@/components/pay-shared-cart";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Pay for a shared bag",
  description: `Cover someone else’s ${site.name} order. No account required.`,
  robots: { index: false },
};

export default async function PaySharedCartPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <>
      <PaySharedCart token={token} />
    </>
  );
}
