import type { MetadataRoute } from "next";
import { getAllEventSlugs, getVendors } from "@/lib/marketplace";
import { getAllProductSlugs, getCollections } from "@/lib/products";
import { absoluteUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [slugs, eventSlugs, vendors, collections] = await Promise.all([
    getAllProductSlugs(),
    getAllEventSlugs(),
    getVendors(),
    getCollections(),
  ]);
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    {
      url: absoluteUrl("/shop"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: absoluteUrl("/shop/sale"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.88,
    },
    {
      url: absoluteUrl("/search"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: absoluteUrl("/brands"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/events"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: absoluteUrl("/calendar"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.84,
    },
    {
      url: absoluteUrl("/ads"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: absoluteUrl("/heritage"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.55,
    },
    {
      url: absoluteUrl("/art"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: absoluteUrl("/about"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.55,
    },
    {
      url: absoluteUrl("/contact"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: absoluteUrl("/sizing"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: absoluteUrl("/brand-signup"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.45,
    },
    {
      url: absoluteUrl("/track"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.35,
    },
    {
      url: absoluteUrl("/terms"),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: absoluteUrl("/privacy"),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];

  const collectionPages: MetadataRoute.Sitemap = collections.map((collection) => ({
    url: absoluteUrl(`/collections/${collection.slug}`),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const productPages: MetadataRoute.Sitemap = slugs
    .filter((slug) => slug !== "sale")
    .map((slug) => ({
      url: absoluteUrl(`/shop/${slug}`),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.75,
    }));

  const eventPages: MetadataRoute.Sitemap = eventSlugs.map((slug) => ({
    url: absoluteUrl(`/events/${slug}`),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const brandPages: MetadataRoute.Sitemap = vendors.map((vendor) => ({
    url: absoluteUrl(`/brands/${vendor.slug}`),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.75,
  }));

  return [
    ...staticPages,
    ...collectionPages,
    ...productPages,
    ...eventPages,
    ...brandPages,
  ];
}
