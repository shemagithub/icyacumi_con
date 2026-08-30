import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BrandProfileCard } from "@/components/brand-profile-card";
import { Container } from "@/components/container";
import { MarketplaceProductGrid } from "@/components/marketplace-product-grid";
import { getVendorBySlug, getVendors } from "@/lib/marketplace";
import { getProductsByVendor } from "@/lib/products";
import { site } from "@/lib/site";

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  const vendors = await getVendors();
  return vendors.map((vendor) => ({ slug: vendor.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const vendor = await getVendorBySlug(slug);
  if (!vendor) return { title: "Brand" };
  return {
    title: vendor.name,
    description: vendor.shortBio,
  };
}

export default async function BrandPage({ params }: { params: Params }) {
  const { slug } = await params;
  const vendor = await getVendorBySlug(slug);
  if (!vendor) notFound();

  const products = await getProductsByVendor(vendor.id);
  const count = products.length;

  return (
    <Container className="py-10 lg:py-14">
      <nav className="text-xs tracking-[0.14em] text-bone-dim uppercase">
        <Link href="/brands" className="hover:text-rust">
          Brands
        </Link>
        <span aria-hidden> / </span>
        <span className="text-coal">{vendor.name}</span>
      </nav>

      <div className="mt-8 max-w-2xl">
        <BrandProfileCard vendor={vendor} productCount={count} showShopCta={false} />
        <p className="mt-4 max-w-lg text-sm leading-relaxed text-bone-dim">
          Craft passport origin:{" "}
          <span className="text-coal">{vendor.location}</span>
          {" · "}
          <Link href="/heritage" className="text-rust underline underline-offset-4">
            Heritage
          </Link>
          {" · "}
          Hosted on {site.name}
        </p>
      </div>

      <section className="mt-12">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-ash-line pb-4">
          <div>
            <p className="eyebrow">Catalog</p>
            <h2 className="font-display mt-1 text-3xl tracking-[0.04em]">
              All {vendor.name} products
            </h2>
          </div>
          <Link
            href="/shop"
            className="text-xs tracking-[0.14em] text-bone-dim uppercase underline-offset-4 hover:text-rust hover:underline"
          >
            Browse all brands
          </Link>
        </div>

        {count > 0 ? (
          <MarketplaceProductGrid
            seed={products}
            sort="views"
            vendorId={vendor.id}
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
    </Container>
  );
}
