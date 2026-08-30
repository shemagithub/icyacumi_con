import type { Ad, Brand, Event, Product as DbProduct } from "../generated/prisma/client.js";

export type VendorDto = {
  id: string;
  slug: string;
  name: string;
  shortBio: string;
  location: string;
  icon: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
  facebook?: string | null;
  twitter?: string | null;
  youtube?: string | null;
  website?: string | null;
};

export type ProductDto = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  category: string;
  collection: string;
  colors: unknown;
  sizes: unknown;
  images: unknown;
  fabric: string;
  fit: string;
  details: unknown;
  badge?: string;
  featured?: boolean;
  inStock: boolean;
  /** Units left in brand inventory. */
  stockQuantity: number;
  vendorId: string;
  brandName?: string;
  brandSlug?: string;
  brandLocation?: string;
  views: number;
  createdAt?: string;
};

export type EventDto = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  date: string;
  time: string;
  venue: string;
  city: string;
  price: number;
  capacity: number;
  ticketsLeft: number;
  image: { src: string; alt: string };
  vendorIds: string[];
};

export type AdDto = {
  id: string;
  slug: string;
  title: string;
  type: string;
  brand: string;
  summary: string;
  media: { src: string; alt: string };
  mediaUrl?: string;
  ctaHref: string;
  ctaLabel: string;
  featured?: boolean;
};

export function mapBrand(brand: Brand): VendorDto {
  return {
    id: brand.id,
    slug: brand.slug,
    name: brand.name,
    shortBio: brand.shortBio,
    location: brand.location,
    icon: brand.icon,
    contactEmail: brand.contactEmail,
    contactPhone: brand.contactPhone,
    instagram: brand.instagram,
    tiktok: brand.tiktok,
    facebook: brand.facebook,
    twitter: brand.twitter,
    youtube: brand.youtube,
    website: brand.website,
  };
}

export function mapProduct(
  row: DbProduct,
  brand?: { name: string; slug: string; location?: string },
): ProductDto {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    description: row.description,
    price: row.price,
    compareAtPrice: row.compareAtPrice ?? undefined,
    category: row.category,
    collection: row.collection,
    colors: row.colors,
    sizes: row.sizes,
    images: row.images,
    fabric: row.fabric,
    fit: row.fit,
    details: row.details,
    badge: row.badge ?? undefined,
    featured: row.featured,
    inStock: Boolean(row.inStock) && row.stockQuantity > 0,
    stockQuantity: Math.max(0, row.stockQuantity ?? 0),
    vendorId: row.brandId,
    brandName: brand?.name,
    brandSlug: brand?.slug,
    brandLocation: brand?.location,
    views: row.views,
    createdAt: row.createdAt?.toISOString?.() ?? undefined,
  };
}

export function mapEvent(row: Event): EventDto {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    date: row.date.toISOString().slice(0, 10),
    time: row.time,
    venue: row.venue,
    city: row.city,
    price: row.price,
    capacity: row.capacity,
    ticketsLeft: row.ticketsLeft,
    image: { src: row.imageSrc, alt: row.imageAlt },
    vendorIds: [row.brandId],
  };
}

export function mapAd(row: Ad & { brand?: Brand }): AdDto {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    type: row.type,
    brand: row.brand?.name ?? "Brand",
    summary: row.summary,
    media: { src: row.mediaSrc, alt: row.mediaAlt },
    mediaUrl: row.mediaUrl ?? undefined,
    ctaHref: row.ctaHref,
    ctaLabel: row.ctaLabel,
    featured: row.featured,
  };
}
