import { cache } from "react";
import {
  categories,
  collections,
  products as seedProducts,
} from "@/data/catalog";
import { backendFetch } from "@/lib/backend";
import { getVendors } from "@/lib/marketplace";
import type {
  Category,
  CategorySlug,
  Collection,
  CollectionSlug,
  ColorOption,
  Product,
  ProductFilters,
  Size,
  SortKey,
} from "@/lib/types";

const SIZE_ORDER: Size[] = ["XS", "S", "M", "L", "XL", "XXL", "OS"];

function normalizeProduct(product: Product): Product {
  const stockQuantity = Math.max(
    0,
    Number.isFinite(product.stockQuantity)
      ? product.stockQuantity
      : product.inStock
        ? 25
        : 0,
  );
  return {
    ...product,
    stockQuantity,
    inStock: Boolean(product.inStock) && stockQuantity > 0,
  };
}

function hasBrandMeta(product: Product) {
  return Boolean(product.brandName && product.brandSlug);
}

async function withBrandMeta(products: Product[]): Promise<Product[]> {
  const normalized = products.map(normalizeProduct);
  if (normalized.every(hasBrandMeta)) return normalized;

  const vendors = await getVendors();
  const byId = Object.fromEntries(vendors.map((vendor) => [vendor.id, vendor]));
  return normalized.map((product) => {
    const vendor = byId[product.vendorId];
    if (!vendor) return product;
    return {
      ...product,
      brandName: product.brandName ?? vendor.name,
      brandSlug: product.brandSlug ?? vendor.slug,
      brandLocation: product.brandLocation ?? vendor.location,
    };
  });
}

function saleScore(product: Product) {
  if (!product.compareAtPrice || product.compareAtPrice <= product.price) return 0;
  return product.compareAtPrice - product.price;
}

function sortProducts(list: Product[], sort: SortKey = "featured"): Product[] {
  const sorted = [...list];
  switch (sort) {
    case "price-asc":
      return sorted.sort((a, b) => a.price - b.price || a.name.localeCompare(b.name));
    case "price-desc":
      return sorted.sort((a, b) => b.price - a.price || a.name.localeCompare(b.name));
    case "sale-desc":
      return sorted.sort(
        (a, b) =>
          saleScore(b) - saleScore(a) ||
          b.views - a.views ||
          a.name.localeCompare(b.name),
      );
    case "newest":
      return sorted.sort((a, b) => {
        const aTime = a.createdAt ? Date.parse(a.createdAt) : 0;
        const bTime = b.createdAt ? Date.parse(b.createdAt) : 0;
        if (bTime !== aTime) return bTime - aTime;
        return b.views - a.views || a.name.localeCompare(b.name);
      });
    case "name-asc":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case "views":
      return sorted.sort((a, b) => b.views - a.views || a.name.localeCompare(b.name));
    case "featured":
    default:
      return sorted.sort((a, b) => {
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        if (a.inStock !== b.inStock) return a.inStock ? -1 : 1;
        return b.views - a.views || a.name.localeCompare(b.name);
      });
  }
}

const loadProducts = cache(async (): Promise<Product[]> => {
  try {
    const response = await backendFetch("/api/catalog/products");
    if (!response.ok) return withBrandMeta(seedProducts);
    const data = (await response.json()) as { products?: Product[] };
    const list = data.products?.length ? data.products : seedProducts;
    return withBrandMeta(list);
  } catch {
    return withBrandMeta(seedProducts);
  }
});

export async function getProducts(filters: ProductFilters = {}): Promise<Product[]> {
  if (filters.vendor && !filters.category && !filters.collection && !filters.size && !filters.color) {
    return getProductsByVendor(filters.vendor, filters.sort);
  }

  const products = await loadProducts();
  const filtered = products.filter((product) => {
    if (filters.category && product.category !== filters.category) return false;
    if (filters.collection && product.collection !== filters.collection) return false;
    if (filters.size && !product.sizes.includes(filters.size)) return false;
    if (filters.color && !product.colors.some((c) => c.name === filters.color)) {
      return false;
    }
    if (filters.vendor && product.vendorId !== filters.vendor) return false;
    return true;
  });

  return sortProducts(filtered, filters.sort);
}

export async function getMostViewedProducts(limit = 8): Promise<Product[]> {
  return sortProducts(await loadProducts(), "views").slice(0, limit);
}

export const getProductsByVendor = cache(async (
  vendorId: string,
  sort: SortKey = "views",
): Promise<Product[]> => {
  try {
    const response = await backendFetch(
      `/api/catalog/products?vendor=${encodeURIComponent(vendorId)}&sort=${encodeURIComponent(sort)}`,
    );
    if (response.ok) {
      const data = (await response.json()) as { products?: Product[] };
      if (data.products) return withBrandMeta(data.products);
    }
  } catch {
    // fall through
  }
  return sortProducts(
    (await loadProducts()).filter((product) => product.vendorId === vendorId),
    sort,
  );
});

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  try {
    const response = await backendFetch(
      `/api/catalog/products/${encodeURIComponent(slug)}`,
    );
    if (response.ok) {
      const data = (await response.json()) as { product?: Product };
      if (data.product) {
        const [hydrated] = await withBrandMeta([data.product]);
        return hydrated;
      }
    }
  } catch {
    // fall through
  }
  const seed = seedProducts.find((product) => product.slug === slug);
  if (!seed) return undefined;
  const [hydrated] = await withBrandMeta([seed]);
  return hydrated;
}

export async function getProductById(id: string): Promise<Product | undefined> {
  const products = await loadProducts();
  return products.find((product) => product.id === id);
}

export async function getAllProductSlugs(): Promise<string[]> {
  return (await loadProducts()).map((product) => product.slug);
}

export async function getFeaturedProducts(limit = 4): Promise<Product[]> {
  return sortProducts(
    (await loadProducts()).filter((product) => product.featured),
    "featured",
  ).slice(0, limit);
}

export async function getRelatedProducts(slug: string, limit = 4): Promise<Product[]> {
  const products = await loadProducts();
  const product = products.find((p) => p.slug === slug);
  if (!product) return [];

  const scored = products
    .filter((p) => p.slug !== slug)
    .map((p) => ({
      product: p,
      score:
        (p.collection === product.collection ? 2 : 0) +
        (p.category === product.category ? 1 : 0) +
        (p.vendorId === product.vendorId ? 2 : 0),
    }))
    .sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name));

  return scored.slice(0, limit).map((entry) => entry.product);
}

export async function getCategories(): Promise<Category[]> {
  return categories;
}

export async function getCollections(): Promise<Collection[]> {
  return collections;
}

export async function getCategory(slug: CategorySlug): Promise<Category | undefined> {
  return categories.find((category) => category.slug === slug);
}

export async function getCollection(
  slug: CollectionSlug,
): Promise<Collection | undefined> {
  return collections.find((collection) => collection.slug === slug);
}

export async function getFacets(): Promise<{ sizes: Size[]; colors: ColorOption[] }> {
  const sizes = new Set<Size>();
  const colors = new Map<string, ColorOption>();

  for (const product of await loadProducts()) {
    product.sizes.forEach((size) => sizes.add(size));
    product.colors.forEach((color) => colors.set(color.name, color));
  }

  return {
    sizes: SIZE_ORDER.filter((size) => sizes.has(size)),
    colors: [...colors.values()].sort((a, b) => a.name.localeCompare(b.name)),
  };
}

const CATEGORY_SLUGS = new Set(categories.map((c) => c.slug as string));
const COLLECTION_SLUGS = new Set(collections.map((c) => c.slug as string));
const SORT_KEYS = new Set<string>([
  "featured",
  "newest",
  "price-desc",
  "price-asc",
  "sale-desc",
  "views",
  "name-asc",
]);

export function parseFilters(
  params: Record<string, string | string[] | undefined>,
): ProductFilters {
  const first = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;

  const category = first(params.category);
  const collection = first(params.collection);
  const size = first(params.size);
  const color = first(params.color);
  const vendor = first(params.vendor);
  const sort = first(params.sort);

  return {
    category:
      category && CATEGORY_SLUGS.has(category) ? (category as CategorySlug) : undefined,
    collection:
      collection && COLLECTION_SLUGS.has(collection)
        ? (collection as CollectionSlug)
        : undefined,
    size: size && SIZE_ORDER.includes(size as Size) ? (size as Size) : undefined,
    color: color || undefined,
    vendor: vendor || undefined,
    sort: sort && SORT_KEYS.has(sort) ? (sort as SortKey) : undefined,
  };
}
