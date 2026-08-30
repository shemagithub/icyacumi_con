import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/container";
import { CultureIcon, type CultureIconName } from "@/components/culture-icons";
import { MarketplaceProductGrid } from "@/components/marketplace-product-grid";
import { ShopFilters } from "@/components/shop-filters";
import { getVendors } from "@/lib/marketplace";
import {
  getCategories,
  getCollections,
  getFacets,
  getProducts,
  parseFilters,
} from "@/lib/products";
import { site } from "@/lib/site";

type SearchParams = Record<string, string | string[] | undefined>;

const DROP_ICONS: Record<string, CultureIconName> = {
  "dust-season": "sun",
  "rodeo-nights": "mask",
  "bone-basics": "textile",
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Shop",
    description: `Season drops and brand floors on ${site.name}.`,
    alternates: { canonical: "/shop" },
  };
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const filters = parseFilters(params);
  const vendorId = typeof params.vendor === "string" ? params.vendor : undefined;
  const mergedFilters = {
    ...filters,
    vendor: vendorId ?? filters.vendor,
    sort: filters.sort ?? "featured",
  };

  const [products, vendors, categories, collections, facets] = await Promise.all([
    getProducts(mergedFilters),
    getVendors(),
    getCategories(),
    getCollections(),
    getFacets(),
  ]);

  const activeVendor = vendorId
    ? vendors.find((vendor) => vendor.id === vendorId)
    : undefined;
  const activeCollection = filters.collection
    ? collections.find((c) => c.slug === filters.collection)
    : undefined;

  return (
    <Container className="py-10 lg:py-14">
      <header className="max-w-2xl">
        <p className="eyebrow">{site.madeIn}</p>
        <h1 className="font-display mt-2 text-5xl tracking-[0.03em] lg:text-6xl">
          {activeCollection?.name ?? activeVendor?.name ?? "Shop"}
        </h1>
        <p className="mt-4 text-base text-bone-dim">
          {activeCollection?.description ??
            "Season drops, brand floors, and filters that follow the cloth · not a generic catalog."}
        </p>
      </header>

      <section className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <p className="eyebrow">Season drops</p>
          <Link
            href="/brands"
            className="text-xs tracking-[0.14em] text-bone-dim uppercase underline underline-offset-4 hover:text-rust"
          >
            Browse brands
          </Link>
        </div>
        <ul className="mt-4 flex flex-wrap gap-2">
          <li>
            <Link
              href="/shop"
              className={`craft-chip px-3 py-2 text-xs tracking-[0.12em] uppercase ${
                !filters.collection && !vendorId
                  ? "craft-chip--active"
                  : "craft-chip--idle"
              }`}
            >
              All
            </Link>
          </li>
          {collections.map((collection) => {
            const active = filters.collection === collection.slug;
            return (
              <li key={collection.slug}>
                <Link
                  href={`/collections/${collection.slug}`}
                  className={`craft-chip inline-flex items-center gap-2 px-3 py-2 text-xs tracking-[0.12em] uppercase ${
                    active ? "craft-chip--active" : "craft-chip--idle"
                  }`}
                >
                  <CultureIcon
                    name={DROP_ICONS[collection.slug] ?? "textile"}
                    className={`h-3.5 w-3.5 ${active ? "text-paint-yellow" : "text-rust"}`}
                  />
                  {collection.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {activeVendor ? (
        <div className="craft-panel mt-8 flex flex-wrap items-center justify-between gap-4 bg-ash/40 p-5">
          <p className="text-sm text-bone-dim">
            Showing <span className="text-coal">{activeVendor.name}</span>
          </p>
          <Link
            href="/shop"
            className="text-xs tracking-[0.14em] text-rust uppercase underline underline-offset-4"
          >
            Clear brand
          </Link>
        </div>
      ) : null}

      <div className="mt-8">
        <ShopFilters
          filters={mergedFilters}
          categories={categories}
          sizes={facets.sizes}
          colors={facets.colors}
          resultCount={products.length}
        />
      </div>

      <div className="mt-12">
        {products.length > 0 ? (
          <MarketplaceProductGrid
            seed={products}
            sort="none"
            priorityCount={4}
            vendorId={vendorId}
          />
        ) : (
          <div className="craft-panel bg-bone/80 px-6 py-20 text-center">
            <p className="font-display text-2xl tracking-[0.05em]">No products</p>
            <p className="mt-3 text-sm text-bone-dim">
              Try clearing filters or opening another season drop.
            </p>
            <Link
              href="/shop"
              className="mt-6 inline-block text-xs tracking-[0.16em] text-rust uppercase underline"
            >
              Clear filters
            </Link>
          </div>
        )}
      </div>
    </Container>
  );
}
