"use client";

import type { AdCreative, AdType, CategorySlug, Product } from "@/lib/types";

const PRODUCTS_KEY = "bone-koboyi.vendor-products.v1";
const ADS_KEY = "bone-koboyi.ads.v1";

export interface VendorProductDraft {
  name: string;
  tagline: string;
  price: number;
  compareAtPrice?: number;
  category: CategorySlug;
  vendorId: string;
  imageSrc: string;
}

export interface AdDraft {
  title: string;
  type: AdType;
  brand: string;
  summary: string;
  mediaSrc: string;
  mediaUrl?: string;
}

function readJson<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function writeJson<T>(key: string, value: T[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota / private mode.
  }
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}

export function listUploadedProducts(): Product[] {
  return readJson<Product>(PRODUCTS_KEY);
}

export function saveUploadedProduct(draft: VendorProductDraft): Product {
  const slugBase = slugify(draft.name) || "product";
  const id = `up-${Date.now()}`;
  const product: Product = {
    id,
    slug: `${slugBase}-${String(Date.now()).slice(-4)}`,
    name: draft.name.trim(),
    tagline: draft.tagline.trim() || "Vendor drop",
    description: draft.tagline.trim() || `${draft.name} from the marketplace.`,
    price: Math.max(100, Math.round(draft.price)),
    compareAtPrice:
      draft.compareAtPrice && draft.compareAtPrice > draft.price
        ? Math.round(draft.compareAtPrice)
        : undefined,
    category: draft.category,
    collection: "bone-basics",
    colors: [{ name: "Default", hex: "#17171A" }],
    sizes: ["S", "M", "L", "XL"],
    images: [
      {
        src: draft.imageSrc,
        alt: draft.name,
      },
    ],
    fabric: "See brand",
    fit: "True to size",
    details: ["Sold by marketplace vendor"],
    featured: false,
    inStock: true,
    stockQuantity: 25,
    vendorId: draft.vendorId,
    views: 1,
  };

  const next = [product, ...listUploadedProducts()];
  writeJson(PRODUCTS_KEY, next);
  return product;
}

export function listUploadedAds(): AdCreative[] {
  return readJson<AdCreative>(ADS_KEY);
}

export function saveUploadedAd(draft: AdDraft): AdCreative {
  const slugBase = slugify(draft.title) || "ad";
  const ad: AdCreative = {
    id: `ad-up-${Date.now()}`,
    slug: `${slugBase}-${String(Date.now()).slice(-4)}`,
    title: draft.title.trim(),
    type: draft.type,
    brand: draft.brand.trim() || "Independent",
    summary: draft.summary.trim() || "Marketplace ad creative.",
    media: { src: draft.mediaSrc, alt: draft.title },
    mediaUrl: draft.mediaUrl?.trim() || undefined,
    ctaHref: "/shop",
    ctaLabel: "Shop now",
    featured: true,
  };

  const next = [ad, ...listUploadedAds()];
  writeJson(ADS_KEY, next);
  return ad;
}
