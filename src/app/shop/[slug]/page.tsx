import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/container";
import { ProductDetail } from "@/components/product-detail";
import { ProductGrid } from "@/components/product-grid";
import { formatPrice } from "@/lib/format";
import {
  getAllProductSlugs,
  getProductBySlug,
  getRelatedProducts,
} from "@/lib/products";
import { getVendorById } from "@/lib/marketplace";
import { site } from "@/lib/site";

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  const slugs = await getAllProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return { title: "Product" };
  }

  const vendor = await getVendorById(product.vendorId);
  const brand = vendor?.name ?? product.brandName ?? site.name;
  const description = [
    product.tagline,
    `${formatPrice(product.price)} · ${brand}`,
    vendor?.location ? `From ${vendor.location}` : null,
    site.madeIn,
  ]
    .filter(Boolean)
    .join(" · ");

  const image = product.images[0];
  const ogImages = image
    ? [
        {
          url: image.src.startsWith("http")
            ? image.src
            : `${site.url}${image.src}`,
          alt: image.alt || product.name,
        },
      ]
    : undefined;

  return {
    title: product.name,
    description,
    alternates: { canonical: `/shop/${product.slug}` },
    openGraph: {
      title: `${product.name} · ${brand}`,
      description,
      url: `/shop/${product.slug}`,
      type: "website",
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} · ${brand}`,
      description,
      images: ogImages?.map((entry) => entry.url),
    },
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const product = (await getProductBySlug(slug)) ?? null;
  const vendor = product ? ((await getVendorById(product.vendorId)) ?? null) : null;
  const related = product ? await getRelatedProducts(slug, 4) : [];

  return (
    <Container className="py-8 lg:py-12">
      <nav aria-label="Breadcrumb" className="text-xs tracking-[0.14em] uppercase">
        <ol className="flex flex-wrap items-center gap-2 text-bone-dim">
          <li>
            <Link href="/" className="hover:text-rust">
              Home
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href="/shop" className="hover:text-rust">
              Shop
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="text-coal">{product?.name ?? "Listing"}</li>
        </ol>
      </nav>

      <ProductDetail seed={product} slug={slug} vendor={vendor} />

      {related.length > 0 ? (
        <div className="mt-16 border-t border-ash-line pt-12">
          <h2 className="font-display text-3xl tracking-[0.04em]">More from brands</h2>
          <div className="mt-8">
            <ProductGrid products={related} />
          </div>
        </div>
      ) : null}

      <p className="mt-10 text-xs text-bone-dim">
        Hosted on {site.name}. Questions?{" "}
        <Link href="/contact" className="underline hover:text-rust">
          Contact
        </Link>
        .
      </p>
    </Container>
  );
}
