import type { Metadata } from "next";
import {
  SITE_OG_LOCALE,
  SITE_REGION,
  siteLocaleTag,
} from "@/lib/intl";
import { site } from "@/lib/site";

export function absoluteUrl(path = "/"): string {
  const base = site.url.replace(/\/$/, "");
  if (!path || path === "/") return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function resolveMediaUrl(src?: string | null): string | undefined {
  if (!src) return undefined;
  if (src.startsWith("data:")) return absoluteUrl(site.logo.src);
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  return absoluteUrl(src);
}

export function truncateMeta(text: string, max = 155): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}

export function buildPageMetadata(input: {
  title: string;
  description: string;
  path?: string;
  image?: string | null;
  imageAlt?: string;
  type?: "website" | "article";
  keywords?: string[];
  noIndex?: boolean;
}): Metadata {
  const path = input.path ?? "/";
  const url = absoluteUrl(path);
  const description = truncateMeta(input.description);
  const imageUrl = resolveMediaUrl(input.image) ?? absoluteUrl(site.logo.src);
  const images = [
    {
      url: imageUrl,
      width: site.logo.width,
      height: site.logo.height,
      alt: input.imageAlt ?? input.title,
    },
  ];

  return {
    title: input.title,
    description,
    keywords: input.keywords,
    alternates: { canonical: path },
    robots: input.noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      type: input.type ?? "website",
      locale: SITE_OG_LOCALE,
      siteName: site.name,
      title: input.title,
      description,
      url,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description,
      images: [imageUrl],
    },
  };
}

export function organizationJsonLd(input: {
  name: string;
  description: string;
  email: string;
  logoUrl: string;
  phone?: string | null;
  sameAs?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${absoluteUrl("/")}/#organization`,
    name: input.name,
    description: input.description,
    url: site.url,
    email: input.email,
    telephone: input.phone || undefined,
    logo: {
      "@type": "ImageObject",
      url: resolveMediaUrl(input.logoUrl) ?? absoluteUrl(site.logo.src),
    },
    areaServed: {
      "@type": "Place",
      name: "Worldwide",
    },
    address: {
      "@type": "PostalAddress",
      addressCountry: SITE_REGION,
    },
    sameAs: (input.sameAs ?? []).filter(Boolean),
  };
}

export function websiteJsonLd(input: {
  name: string;
  description: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${absoluteUrl("/")}/#website`,
    name: input.name,
    description: input.description,
    url: site.url,
    inLanguage: siteLocaleTag(),
    publisher: { "@id": `${absoluteUrl("/")}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${absoluteUrl("/search")}?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(
  items: Array<{ name: string; path: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function productJsonLd(input: {
  name: string;
  description: string;
  slug: string;
  image?: string;
  images?: string[];
  price: number;
  compareAtPrice?: number;
  currency?: string;
  brandName?: string;
  sku?: string;
  category?: string;
  availability?: "InStock" | "OutOfStock";
}) {
  const images = (input.images?.length
    ? input.images
    : input.image
      ? [input.image]
      : []
  )
    .map((src) => resolveMediaUrl(src))
    .filter(Boolean);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    description: truncateMeta(input.description, 300),
    image: images.length ? images : undefined,
    sku: input.sku,
    category: input.category,
    brand: input.brandName
      ? { "@type": "Brand", name: input.brandName }
      : undefined,
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/shop/${input.slug}`),
      priceCurrency: (input.currency ?? site.currency).toUpperCase(),
      price: String(input.price),
      priceValidUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
        .toISOString()
        .slice(0, 10),
      availability: `https://schema.org/${input.availability ?? "InStock"}`,
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        name: site.name,
      },
    },
  };
}

export function brandJsonLd(input: {
  name: string;
  description: string;
  slug: string;
  location?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Brand",
    name: input.name,
    description: truncateMeta(input.description, 300),
    url: absoluteUrl(`/brands/${input.slug}`),
    ...(input.location
      ? {
          areaServed: {
            "@type": "Place",
            name: input.location,
          },
        }
      : {}),
  };
}

export function eventJsonLd(input: {
  name: string;
  description: string;
  slug: string;
  startDate: string;
  endDate?: string;
  time?: string;
  venue: string;
  city: string;
  image?: string;
  price: number;
  currency?: string;
  availability?: "InStock" | "SoldOut";
}) {
  const start = input.time
    ? `${input.startDate}T${normalizeEventTime(input.time)}`
    : input.startDate;

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: input.name,
    description: truncateMeta(input.description, 300),
    url: absoluteUrl(`/events/${input.slug}`),
    image: resolveMediaUrl(input.image),
    startDate: start,
    endDate: input.endDate ?? start,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: {
      "@type": "Place",
      name: input.venue,
      address: {
        "@type": "PostalAddress",
        addressLocality: input.city,
        addressCountry: SITE_REGION,
      },
    },
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/events/${input.slug}`),
      price: String(input.price),
      priceCurrency: (input.currency ?? site.currency).toUpperCase(),
      availability: `https://schema.org/${
        input.availability === "SoldOut" ? "SoldOut" : "InStock"
      }`,
    },
    organizer: {
      "@type": "Organization",
      name: site.name,
      url: site.url,
    },
  };
}

export function collectionPageJsonLd(input: {
  name: string;
  description: string;
  path: string;
  items: Array<{ name: string; path: string }>;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: input.name,
    description: truncateMeta(input.description, 300),
    url: absoluteUrl(input.path),
    mainEntity: {
      "@type": "ItemList",
      itemListElement: input.items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: absoluteUrl(item.path),
        name: item.name,
      })),
    },
  };
}

function normalizeEventTime(time: string) {
  const trimmed = time.trim();
  if (/^\d{1,2}:\d{2}$/.test(trimmed)) {
    const [h, m] = trimmed.split(":");
    return `${h.padStart(2, "0")}:${m}:00`;
  }
  const match = trimmed.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i);
  if (!match) return "18:00:00";
  let hours = Number(match[1]);
  const minutes = match[2] ?? "00";
  const meridian = match[3].toLowerCase();
  if (meridian === "pm" && hours < 12) hours += 12;
  if (meridian === "am" && hours === 12) hours = 0;
  return `${String(hours).padStart(2, "0")}:${minutes}:00`;
}

export { SITE_OG_LOCALE };
