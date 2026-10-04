import Link from "next/link";
import { MarketplaceProductGrid } from "@/components/marketplace-product-grid";
import { isOnSale } from "@/lib/products";
import type { Product } from "@/lib/types";

export function BrandCatalogTabs({
  brandName,
  brandSlug,
  vendorId,
  products,
  tab,
}: {
  brandName: string;
  brandSlug: string;
  vendorId: string;
  products: Product[];
  tab?: string;
}) {
  const sale = tab === "sale";
  const discounted = products.filter(isOnSale);
  const list = sale ? discounted : products;

  return (
    <section className="mt-12">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-ash-line pb-4">
        <div>
          <p className="eyebrow">Catalog</p>
          <h2 className="font-display mt-1 text-3xl tracking-[0.04em]">
            {sale ? `${brandName} on promo` : `All ${brandName} products`}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/brands/${brandSlug}`}
            className={`rounded-full px-4 py-2 text-xs font-bold tracking-[0.14em] uppercase ${
              !sale ? "bg-coal text-bone" : "bg-ash text-bone-dim hover:text-coal"
            }`}
            aria-current={!sale ? "page" : undefined}
          >
            All ({products.length})
          </Link>
          <Link
            href={`/brands/${brandSlug}?tab=sale`}
            className={`rounded-full px-4 py-2 text-xs font-bold tracking-[0.14em] uppercase ${
              sale ? "bg-rust text-bone" : "bg-ash text-bone-dim hover:text-coal"
            }`}
            aria-current={sale ? "page" : undefined}
          >
            Sale ({discounted.length})
          </Link>
          <Link
            href="/shop"
            className="ml-1 text-xs tracking-[0.14em] text-bone-dim uppercase underline-offset-4 hover:text-rust hover:underline"
          >
            Browse all brands
          </Link>
        </div>
      </div>

      {sale && discounted.length === 0 ? (
        <div className="craft-panel bg-bone/80 px-6 py-16 text-center">
          <p className="font-display text-2xl tracking-[0.05em]">No promo pieces yet</p>
          <p className="mt-2 text-sm text-bone-dim">
            This brand has not marked any products with a compare-at price.
          </p>
          <Link
            href="/shop/sale"
            className="mt-4 inline-block text-xs font-bold tracking-[0.14em] text-rust uppercase underline underline-offset-4"
          >
            See all marketplace promos
          </Link>
        </div>
      ) : list.length > 0 ? (
        <MarketplaceProductGrid
          seed={list}
          sort={sale ? "none" : "views"}
          vendorId={vendorId}
          priorityCount={4}
        />
      ) : (
        <div className="craft-panel bg-bone/80 px-6 py-16 text-center">
          <p className="font-display text-2xl tracking-[0.05em]">No products yet</p>
          <p className="mt-2 text-sm text-bone-dim">
            This brand has not uploaded products to the shop.
          </p>
        </div>
      )}
    </section>
  );
}
