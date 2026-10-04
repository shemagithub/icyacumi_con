import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/cart",
          "/checkout",
          "/checkout/",
          "/portal",
          "/portal/",
          "/admin",
          "/admin/",
          "/account",
          "/account/",
          "/api/",
          "/pay/",
          "/login",
          "/register",
          "/forgot-password",
          "/reset-password",
          "/verify-email",
          "/brand-pending",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: [
          "/cart",
          "/checkout",
          "/portal",
          "/admin",
          "/account",
          "/api/",
          "/pay/",
        ],
      },
      {
        userAgent: "Bingbot",
        allow: "/",
        disallow: [
          "/cart",
          "/checkout",
          "/portal",
          "/admin",
          "/account",
          "/api/",
          "/pay/",
        ],
      },
      {
        userAgent: "GPTBot",
        allow: ["/"],
        disallow: ["/cart", "/checkout", "/portal", "/admin", "/account", "/api/"],
      },
      {
        userAgent: "ClaudeBot",
        allow: ["/"],
        disallow: ["/cart", "/checkout", "/portal", "/admin", "/account", "/api/"],
      },
      {
        userAgent: "PerplexityBot",
        allow: ["/"],
        disallow: ["/cart", "/checkout", "/portal", "/admin", "/account", "/api/"],
      },
    ],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
