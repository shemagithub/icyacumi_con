import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { fetchPublicSiteSettings } from "@/lib/site-settings";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const live = await fetchPublicSiteSettings();
  return {
    name: live.companyName,
    short_name: live.shortName,
    description: live.positioning,
    start_url: "/",
    display: "standalone",
    background_color: "#f5f1ea",
    theme_color: "#1a1a1a",
    lang: "en",
    categories: ["shopping", "lifestyle", "entertainment"],
    icons: [
      {
        src: "/brand/favicon-32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: site.logo.src,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
