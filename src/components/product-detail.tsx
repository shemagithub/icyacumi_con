"use client";

import Link from "next/link";
import { AddToCartForm } from "@/components/add-to-cart-form";
import { BrandProfileCard } from "@/components/brand-profile-card";
import { CreditsList } from "@/components/credits-list";
import { CraftPassport } from "@/components/craft-passport";
import { ProductGallery } from "@/components/product-gallery";
import { ShareProductButton } from "@/components/share-product-button";
import { categories } from "@/data/catalog";
import { buildCraftPassport } from "@/lib/craft-passport";
import { discountPercent } from "@/lib/format";
import { Price } from "@/components/price";
import { getVendorName } from "@/lib/marketplace";
import type { Product, Vendor } from "@/lib/types";

export function ProductDetail({
  seed,
  vendor,
}: {
  seed: Product | null;
  slug: string;
  vendor: Vendor | null;
}) {
  const product = seed;

  if (!product) {
    return (
      <div className="craft-panel mt-10 bg-bone/80 px-6 py-16 text-center">
        <p className="font-display text-2xl tracking-[0.05em]">Product not found</p>
        <Link href="/shop" className="mt-6 inline-block text-xs tracking-[0.16em] uppercase underline">
          Back to shop
        </Link>
      </div>
    );
  }

  const brandName =
    vendor?.name ?? product.brandName ?? getVendorName(product.vendorId);
  const brandSlug = vendor?.slug ?? product.brandSlug;
  const brandHref = brandSlug ? `/brands/${brandSlug}` : "/brands";
  const off = discountPercent(product.price, product.compareAtPrice);
  const categoryName =
    categories.find((category) => category.slug === product.category)?.name ??
    product.category;

  return (
    <div className="mt-8 grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
      <ProductGallery images={product.images} />

      <div className="lg:pt-4">
        <Link
          href="#brand-profile"
          className="eyebrow inline-flex items-center gap-2 text-rust transition-colors hover:text-coal"
        >
          {brandName}
          <span className="text-[0.6rem] tracking-[0.14em] text-bone-dim normal-case">
            Brand profile ↓
          </span>
        </Link>

        <h1 className="font-display mt-3 text-4xl leading-tight tracking-[0.03em] lg:text-5xl">
          {product.name}
        </h1>
        <p className="mt-2 text-sm text-bone-dim">{product.tagline}</p>

        <div className="mt-4 flex flex-wrap items-baseline gap-3">
          <Price
            amount={product.price}
            compareAt={product.compareAtPrice}
            size="lg"
          />
          {off ? (
            <span className="rounded-sm bg-rust px-2 py-1 text-[0.65rem] font-bold tracking-[0.14em] text-bone uppercase">
              −{off}%
            </span>
          ) : null}
        </div>

        <dl className="product-specs mt-6 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-ash-line bg-ash-line sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              label: "Brand",
              value: (
                <Link
                  href={brandHref}
                  className="font-semibold text-rust underline-offset-2 hover:underline"
                >
                  {brandName}
                </Link>
              ),
            },
            { label: "Category", value: categoryName },
            {
              label: "Availability",
              value: product.inStock
                ? product.stockQuantity <= 5
                  ? `Only ${product.stockQuantity} left`
                  : `In stock · ${product.stockQuantity} available`
                : "Sold out",
            },
            ...(vendor?.location || product.brandLocation
              ? [
                  {
                    label: "From",
                    value: vendor?.location ?? product.brandLocation ?? "",
                  },
                ]
              : []),
            { label: "Fabric", value: product.fabric },
            { label: "Fit", value: product.fit },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-bone px-4 py-3.5 sm:min-h-[5.25rem]"
            >
              <dt className="text-[0.65rem] font-semibold tracking-[0.16em] text-bone-dim uppercase">
                {item.label}
              </dt>
              <dd className="mt-1.5 text-sm leading-snug text-coal">{item.value}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-6 text-base leading-relaxed text-bone-dim">
          {product.description}
        </p>

        {product.details?.length ? (
          <ul className="mt-4 space-y-1.5 text-sm text-bone-dim">
            {product.details.map((detail) => (
              <li key={detail} className="flex gap-2">
                <span className="text-rust" aria-hidden>
                  -
                </span>
                <span>{detail}</span>
              </li>
            ))}
          </ul>
        ) : null}

        <AddToCartForm product={product} />

        <ShareProductButton
          product={product}
          brandName={brandName}
          originCity={vendor?.location ?? product.brandLocation}
        />

        <CreditsList credits={product.credits} title="Credits" />

        <CraftPassport data={buildCraftPassport(product, vendor)} />

        {vendor ? (
          <BrandProfileCard vendor={vendor} compact />
        ) : (
          <div className="mt-8 rounded-xl border border-ash-line bg-bone px-5 py-5">
            <p className="text-[0.65rem] font-semibold tracking-[0.16em] text-bone-dim uppercase">
              Sold by
            </p>
            <p className="font-display mt-2 text-2xl tracking-[0.04em] text-coal">
              {brandName}
            </p>
            <Link
              href={brandHref}
              className="mt-5 inline-flex rounded-full bg-rust px-5 py-3 text-xs font-bold tracking-[0.16em] text-bone uppercase transition-colors hover:bg-sand"
            >
              See all {brandName} products
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
