import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/container";
import { MarketplaceProductGrid } from "@/components/marketplace-product-grid";
import { getDiscountedProducts } from "@/lib/products";
import { site } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Sale",
    description: `Discount promos from brands on ${site.name} · pieces that have sat in stock, now cut.`,
    alternates: { canonical: "/shop/sale" },
  };
}

export default async function SalePage() {
  const products = await getDiscountedProducts();

  return (
    <Container className="py-10 lg:py-14">
      <nav className="text-xs tracking-[0.14em] text-bone-dim uppercase">
        <Link href="/shop" className="hover:text-rust">
          Shop
        </Link>
        <span aria-hidden> / </span>
        <span className="text-coal">Sale</span>
      </nav>

      <header className="mt-6 max-w-2xl">
        <p className="eyebrow">Promo</p>
        <h1 className="font-display mt-2 text-5xl tracking-[0.03em] lg:text-6xl">
          All discounted products
        </h1>
        <p className="mt-4 text-base leading-relaxed text-bone-dim">
          Brands put a compare-at price on pieces that have been in stock a while.
          Every product here is on promo right now.
        </p>
      </header>

      <div className="mt-10">
        {products.length > 0 ? (
          <MarketplaceProductGrid seed={products} sort="none" priorityCount={4} />
        ) : (
          <div className="craft-panel bg-bone/80 px-6 py-16 text-center">
            <p className="font-display text-2xl tracking-[0.05em]">No promos running</p>
            <p className="mt-2 text-sm text-bone-dim">
              When a brand marks a was-price higher than the shop price, it lands here.
            </p>
            <Link
              href="/shop"
              className="mt-4 inline-block text-xs font-bold tracking-[0.14em] text-rust uppercase underline underline-offset-4"
            >
              Back to shop
            </Link>
          </div>
        )}
      </div>
    </Container>
  );
}
