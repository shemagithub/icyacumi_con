import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

export const metadata: Metadata = buildPageMetadata({
  title: "About",
  description: `The story behind ${site.name} · contemporary African craft, streetwear, events, and ads.`,
  path: "/about",
  keywords: ["about", site.name, site.madeIn, "African fashion"],
});

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
