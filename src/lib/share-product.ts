import { formatPrice } from "@/lib/format";
import { site } from "@/lib/site";
import type { Product } from "@/lib/types";

/** Build product page absolute URL for sharing. */
export function productShareUrl(slug: string, origin?: string) {
  const base = (origin || site.url).replace(/\/$/, "");
  return `${base}/shop/${slug}`;
}

/**
 * Rich caption with the details people need when someone opens WhatsApp / IG / etc.
 */
export function buildProductShareText({
  product,
  brandName,
  originCity,
  url,
}: {
  product: Product;
  brandName: string;
  originCity?: string | null;
  url: string;
}) {
  const lines = [
    `${product.name}`,
    product.tagline,
    "",
    `Brand: ${brandName}`,
    `Price: ${formatPrice(product.price)}`,
  ];

  if (originCity) lines.push(`From: ${originCity}`);
  if (product.fabric && product.fabric !== "-") lines.push(`Fabric: ${product.fabric}`);
  if (product.fit && product.fit !== "-") lines.push(`Fit: ${product.fit}`);
  lines.push(product.inStock ? "Availability: In stock" : "Availability: Sold out");
  lines.push("");
  lines.push(`${site.madeIn} · ${site.name}`);
  lines.push(url);

  return lines.join("\n");
}

export function shareChannelHref(
  channel: "whatsapp" | "facebook" | "x" | "telegram" | "sms",
  text: string,
  url: string,
) {
  switch (channel) {
    case "whatsapp":
      return `https://wa.me/?text=${encodeURIComponent(text)}`;
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    case "x":
      return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    case "telegram":
      return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
    case "sms":
      return `sms:?body=${encodeURIComponent(text)}`;
  }
}
