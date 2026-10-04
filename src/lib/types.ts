export type CategorySlug =
  | "outerwear"
  | "fleece"
  | "tees"
  | "shirts"
  | "denim"
  | "pants"
  | "accessories";

export type CollectionSlug = "dust-season" | "rodeo-nights" | "bone-basics";

export type Size = "XS" | "S" | "M" | "L" | "XL" | "XXL" | "OS";

export type AdType = "photo" | "visual" | "video";

export type CartLineKind = "product" | "ticket";

export interface ColorOption {
  name: string;
  hex: string;
}

export interface ProductImage {
  src: string;
  alt: string;
}

/** Someone who worked a product, event, or ad · public shout-out. */
export interface Credit {
  role: string;
  name: string;
  url?: string;
}

export interface Vendor {
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
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  /** Price in whole RWF francs. */
  price: number;
  compareAtPrice?: number;
  category: CategorySlug;
  collection: CollectionSlug;
  colors: ColorOption[];
  sizes: Size[];
  images: ProductImage[];
  fabric: string;
  fit: string;
  details: string[];
  badge?: string;
  featured?: boolean;
  inStock: boolean;
  /** Units left in brand inventory (0 = sold out). */
  stockQuantity: number;
  /** Brand that sells this product. */
  vendorId: string;
  /** Optional hydrated brand label for cards. */
  brandName?: string;
  /** Brand public page slug. */
  brandSlug?: string;
  /** Brand location label. */
  brandLocation?: string;
  /** View count · used to surface popular products in Shop. */
  views: number;
  /** ISO timestamp when available · used for newest sort. */
  createdAt?: string;
  /** ISO timestamp when the product last changed · used for recent promos. */
  updatedAt?: string;
  /** People to shout out on the product page. */
  credits?: Credit[];
}

export interface Category {
  slug: CategorySlug;
  name: string;
  description: string;
}

export interface Collection {
  slug: CollectionSlug;
  name: string;
  description: string;
}

export type SortKey =
  | "featured"
  | "newest"
  | "price-desc"
  | "price-asc"
  | "sale-desc"
  | "views"
  | "name-asc";

export interface ProductFilters {
  category?: CategorySlug;
  collection?: CollectionSlug;
  size?: Size;
  color?: string;
  vendor?: string;
  sort?: SortKey;
}

export interface MarketEvent {
  id: string;
  slug: string;
  title: string;
  summary: string;
  date: string;
  time: string;
  venue: string;
  city: string;
  /** Ticket price in cents. */
  price: number;
  capacity: number;
  ticketsLeft: number;
  image: ProductImage;
  vendorIds: string[];
  credits?: Credit[];
}

export interface AdCreative {
  id: string;
  slug: string;
  title: string;
  type: AdType;
  brand: string;
  summary: string;
  media: ProductImage;
  /** Optional video or external media URL for ads. */
  mediaUrl?: string;
  ctaHref: string;
  ctaLabel: string;
  featured?: boolean;
  credits?: Credit[];
}

/** A line in the cart. */
export interface CartLine {
  id: string;
  productId: string;
  slug: string;
  name: string;
  price: number;
  size: Size;
  color: string;
  image: ProductImage;
  quantity: number;
  kind?: CartLineKind;
  /** Max units allowed for this line from live inventory. */
  stockCap?: number;
}
