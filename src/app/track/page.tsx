import type { Metadata } from "next";
import { TrackOrderForm } from "@/components/track-order-form";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Track order",
  description: `Track your ${site.name} delivery with your order reference.`,
};

export default function TrackPage() {
  return (
    <>
      <TrackOrderForm />
    </>
  );
}
