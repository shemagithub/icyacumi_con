import type { Metadata } from "next";
import { TrackOrderView } from "@/components/track-order-view";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Delivery status",
  description: `Live delivery timeline for your ${site.name} order.`,
  robots: { index: false },
};

export default async function TrackReferencePage({
  params,
  searchParams,
}: {
  params: Promise<{ reference: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { reference } = await params;
  const query = await searchParams;
  const emailRaw = query.email;
  const email = typeof emailRaw === "string" ? emailRaw.trim() : undefined;

  return (
    <>
      <TrackOrderView reference={reference} email={email || undefined} />
    </>
  );
}
