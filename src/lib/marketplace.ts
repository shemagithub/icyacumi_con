import { cache } from "react";
import { ads as seedAds, events as seedEvents, vendors as seedVendors } from "@/data/marketplace";
import { backendFetch } from "@/lib/backend";
import type { AdCreative, MarketEvent, Vendor } from "@/lib/types";

export const getVendors = cache(async (): Promise<Vendor[]> => {
  try {
    const response = await backendFetch("/api/catalog/brands");
    if (response.ok) {
      const data = (await response.json()) as { brands?: Vendor[] };
      if (data.brands?.length) return data.brands;
    }
  } catch {
    // fall through
  }
  return seedVendors;
});

export const getVendorById = cache(async (id: string): Promise<Vendor | undefined> => {
  try {
    const response = await backendFetch(
      `/api/catalog/brands/id/${encodeURIComponent(id)}`,
    );
    if (response.ok) {
      const data = (await response.json()) as { brand?: Vendor };
      if (data.brand) return data.brand;
    }
  } catch {
    // fall through
  }
  return (await getVendors()).find((vendor) => vendor.id === id);
});

export function getVendorName(vendorId: string): string {
  return seedVendors.find((vendor) => vendor.id === vendorId)?.name ?? "Brand";
}

export function getVendorMap(): Record<string, Vendor> {
  return Object.fromEntries(seedVendors.map((vendor) => [vendor.id, vendor]));
}

export const getVendorBySlug = cache(async (slug: string): Promise<Vendor | undefined> => {
  try {
    const response = await backendFetch(
      `/api/catalog/brands/${encodeURIComponent(slug)}`,
    );
    if (response.ok) {
      const data = (await response.json()) as { brand?: Vendor };
      if (data.brand) return data.brand;
    }
  } catch {
    // fall through
  }
  return seedVendors.find((vendor) => vendor.slug === slug);
});

export const getEvents = cache(async (): Promise<MarketEvent[]> => {
  try {
    const response = await backendFetch("/api/catalog/events");
    if (response.ok) {
      const data = (await response.json()) as { events?: MarketEvent[] };
      if (data.events?.length) return data.events;
    }
  } catch {
    // fall through
  }
  return [...seedEvents].sort((a, b) => a.date.localeCompare(b.date));
});

export async function getEventBySlug(slug: string): Promise<MarketEvent | undefined> {
  try {
    const response = await backendFetch(
      `/api/catalog/events/${encodeURIComponent(slug)}`,
    );
    if (response.ok) {
      const data = (await response.json()) as { event?: MarketEvent };
      if (data.event) return data.event;
    }
  } catch {
    // fall through
  }
  return seedEvents.find((event) => event.slug === slug);
}

export async function getEventById(id: string): Promise<MarketEvent | undefined> {
  return (await getEvents()).find((event) => event.id === id);
}

export async function getAllEventSlugs(): Promise<string[]> {
  return (await getEvents()).map((event) => event.slug);
}

export const getAds = cache(async (featuredOnly = false): Promise<AdCreative[]> => {
  try {
    const qs = featuredOnly ? "?featured=1" : "";
    const response = await backendFetch(`/api/catalog/ads${qs}`);
    if (response.ok) {
      const data = (await response.json()) as { ads?: AdCreative[] };
      if (data.ads?.length) return data.ads;
    }
  } catch {
    // fall through
  }
  return featuredOnly ? seedAds.filter((ad) => ad.featured) : seedAds;
});

export async function getAdBySlug(slug: string): Promise<AdCreative | undefined> {
  return (await getAds()).find((ad) => ad.slug === slug);
}

export function formatEventDate(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00`);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
