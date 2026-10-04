import { getAds, getEvents, getVendors } from "@/lib/marketplace";
import { getProducts } from "@/lib/products";
import type { AdCreative, MarketEvent, Product, Vendor } from "@/lib/types";

export type SiteSearchResult = {
  query: string;
  products: Product[];
  brands: Vendor[];
  events: MarketEvent[];
  ads: AdCreative[];
};

function matches(query: string, ...fields: Array<string | null | undefined>) {
  const tokens = query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 6);
  if (!tokens.length) return false;
  const hay = fields
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return tokens.every((token) => hay.includes(token));
}

/** Shared catalog search used by `/api/search` and the public `/search` page. */
export async function searchCatalog(
  rawQuery: string,
  limits?: {
    products?: number;
    brands?: number;
    events?: number;
    ads?: number;
  },
): Promise<SiteSearchResult> {
  const query = String(rawQuery ?? "")
    .trim()
    .slice(0, 80);

  if (query.length < 1) {
    return { query, products: [], brands: [], events: [], ads: [] };
  }

  const [productsAll, brandsAll, eventsAll, adsAll] = await Promise.all([
    getProducts({ sort: "views" }),
    getVendors(),
    getEvents(),
    getAds(),
  ]);

  return {
    query,
    products: productsAll
      .filter((product) =>
        matches(
          query,
          product.name,
          product.tagline,
          product.description,
          product.category,
          product.fabric,
          product.brandName,
          product.brandLocation,
          product.brandSlug,
        ),
      )
      .slice(0, limits?.products ?? 12),
    brands: brandsAll
      .filter((brand) =>
        matches(query, brand.name, brand.shortBio, brand.location, brand.slug),
      )
      .slice(0, limits?.brands ?? 8),
    events: eventsAll
      .filter((event) =>
        matches(
          query,
          event.title,
          event.summary,
          event.venue,
          event.city,
          event.slug,
        ),
      )
      .slice(0, limits?.events ?? 8),
    ads: adsAll
      .filter((ad) =>
        matches(query, ad.title, ad.summary, ad.type, ad.brand, ad.slug),
      )
      .slice(0, limits?.ads ?? 6),
  };
}
