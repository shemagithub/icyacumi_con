import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BrandCatalogTabs } from "@/components/brand-catalog-tabs";
import { BrandProfileCard } from "@/components/brand-profile-card";
import { Container } from "@/components/container";
import { JsonLd } from "@/components/json-ld";
import { getVendorBySlug, getVendors } from "@/lib/marketplace";
import { getProductsByVendor } from "@/lib/products";
import {
  brandJsonLd,
  breadcrumbJsonLd,
  buildPageMetadata,
  collectionPageJsonLd,
} from "@/lib/seo";
import { site } from "@/lib/site";

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<{ tab?: string | string[] }>;

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
  return buildPageMetadata({
    title: vendor.name,
    description: `${vendor.shortBio} · ${vendor.location} · on ${site.name}`,
    path: `/brands/${vendor.slug}`,
    keywords: [
      vendor.name,
      vendor.location,
      "African brand",
      site.name,
      site.madeIn,
      "marketplace",
    ],
  });
}

export default async function BrandPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const tab = Array.isArray(query.tab) ? query.tab[0] : query.tab;
  const vendor = await getVendorBySlug(slug);
  if (!vendor) notFound();

  const products = await getProductsByVendor(vendor.id);
  const count = products.length;

  return (
    <Container className="py-10 lg:py-14">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Brands", path: "/brands" },
            { name: vendor.name, path: `/brands/${vendor.slug}` },
          ]),
          brandJsonLd({
            name: vendor.name,
            description: vendor.shortBio,
            slug: vendor.slug,
            location: vendor.location,
          }),
          collectionPageJsonLd({
            name: `${vendor.name} on ${site.name}`,
            description: vendor.shortBio,
            path: `/brands/${vendor.slug}`,
            items: products.slice(0, 24).map((product) => ({
              name: product.name,
              path: `/shop/${product.slug}`,
            })),
          }),
        ]}
      />

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

      <BrandCatalogTabs
        brandName={vendor.name}
        brandSlug={vendor.slug}
        vendorId={vendor.id}
        products={products}
        tab={tab}
      />
    </Container>
  );
}
