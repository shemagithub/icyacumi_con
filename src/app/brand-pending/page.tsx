import type { Metadata } from "next";
import BrandPendingClient from "./pending-client";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Brand approval pending",
  description: `Your ${site.name} brand application is waiting for approval.`,
};

export default function BrandPendingPage() {
  return <BrandPendingClient />;
}
