import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/container";
import { JsonLd } from "@/components/json-ld";
import { ProductDetail } from "@/components/product-detail";
import { ProductGrid } from "@/components/product-grid";
import { formatPrice } from "@/lib/format";
import {
  getAllProductSlugs,
  getProductBySlug,
  getRelatedProducts,
} from "@/lib/products";
import { getVendorById } from "@/lib/marketplace";
import {
  breadcrumbJsonLd,
  buildPageMetadata,
  productJsonLd,
} from "@/lib/seo";
import { site } from "@/lib/site";

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  const slugs = await getAllProductSlugs();
  return slugs.filter((slug) => slug !== "sale").map((slug) => ({ slug }));
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
    product.tagline || product.description,
    `${formatPrice(product.price)} · ${brand}`,
    vendor?.location ? `From ${vendor.location}` : null,
    site.madeIn,
  ]
    .filter(Boolean)
    .join(" · ");

  return buildPageMetadata({
    title: product.name,
    description,
    path: `/shop/${product.slug}`,
    image: product.images[0]?.src,
    imageAlt: product.images[0]?.alt || product.name,
    keywords: [
      product.name,
      brand,
      product.category,
      product.collection,
      site.name,
      site.madeIn,
      "buy online",
    ],
  });
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const product = (await getProductBySlug(slug)) ?? null;
  const vendor = product ? ((await getVendorById(product.vendorId)) ?? null) : null;
  const related = product ? await getRelatedProducts(slug, 4) : [];
  const brand = vendor?.name ?? product?.brandName ?? site.name;

  return (
    <Container className="py-8 lg:py-12">
      {product ? (
        <JsonLd
          data={[
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Shop", path: "/shop" },
              { name: product.name, path: `/shop/${product.slug}` },
            ]),
            productJsonLd({
              name: product.name,
              description: product.description || product.tagline,
              slug: product.slug,
              images: product.images.map((image) => image.src),
              price: product.price,
              compareAtPrice: product.compareAtPrice,
              brandName: brand,
              sku: product.id,
              category: product.category,
              availability:
                product.inStock && product.stockQuantity > 0
                  ? "InStock"
                  : "OutOfStock",
            }),
          ]}
        />
      ) : null}

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
