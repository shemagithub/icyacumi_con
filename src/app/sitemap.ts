import type { MetadataRoute } from "next";
import { getAllEventSlugs, getVendors } from "@/lib/marketplace";
import { getAllProductSlugs } from "@/lib/products";
import { site } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [slugs, eventSlugs, vendors] = await Promise.all([
    getAllProductSlugs(),
    getAllEventSlugs(),
    getVendors(),
  ]);
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: site.url, lastModified: now, changeFrequency: "weekly", priority: 1 },
    {
      url: `${site.url}/shop`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: `${site.url}/brands`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${site.url}/events`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${site.url}/calendar`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.84,
    },
    {
      url: `${site.url}/ads`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${site.url}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${site.url}/terms`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${site.url}/privacy`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${site.url}/track`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${site.url}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${site.url}/heritage`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.45,
    },
  ];

  const productPages: MetadataRoute.Sitemap = slugs.map((slug) => ({
    url: `${site.url}/shop/${slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const eventPages: MetadataRoute.Sitemap = eventSlugs.map((slug) => ({
    url: `${site.url}/events/${slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const brandPages: MetadataRoute.Sitemap = vendors.map((vendor) => ({
    url: `${site.url}/brands/${vendor.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.75,
  }));

  return [...staticPages, ...productPages, ...eventPages, ...brandPages];
}
