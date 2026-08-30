import Link from "next/link";
import { MediaImage } from "@/components/media-image";
import { Price } from "@/components/price";
import { discountPercent } from "@/lib/format";
import { getVendorName } from "@/lib/marketplace";
import type { Product } from "@/lib/types";

const CARD_SIZES =
  "(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw";

export function ProductCard({
  product,
  priority = false,
}: {
  product: Product;
  priority?: boolean;
}) {
  const primary = product.images[0];
  const brand = product.brandName ?? getVendorName(product.vendorId);
  const brandHref = product.brandSlug ? `/brands/${product.brandSlug}` : "/brands";
  const off = discountPercent(product.price, product.compareAtPrice);
  const onSale = off !== null;

  return (
    <article className="culture-card group flex h-full flex-col">
      <Link
        href={`/shop/${product.slug}`}
        className="craft-frame relative aspect-[4/5] overflow-hidden bg-ash"
        aria-label={`View ${product.name}`}
      >
        <MediaImage
          src={primary.src}
          alt={primary.alt}
          fill
          sizes={CARD_SIZES}
          priority={priority}
          className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        />

        <div className="culture-card__weave" aria-hidden />

        <div className="absolute top-3 left-3 z-[4] flex flex-col items-start gap-1.5">
          {onSale ? (
            <span className="culture-fire bg-rust px-2.5 py-1 text-[0.625rem] tracking-[0.16em] text-bone uppercase">
              −{off}%
            </span>
          ) : null}
          {product.badge && product.inStock ? (
            <span className="bg-paint-yellow px-2.5 py-1 text-[0.625rem] tracking-[0.16em] text-coal uppercase">
              {product.badge}
            </span>
          ) : null}
        </div>

        {!product.inStock ? (
          <span className="absolute inset-0 z-[4] flex items-center justify-center bg-coal/65 text-xs tracking-[0.2em] text-bone uppercase">
            Sold Out
          </span>
        ) : null}

        <span className="absolute inset-x-0 bottom-0 z-[3] translate-y-2 bg-gradient-to-t from-coal/70 to-transparent px-3 pt-10 pb-3 text-[0.65rem] tracking-[0.14em] text-bone uppercase opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          Quick look →
        </span>
      </Link>

      <div className="mt-4 flex flex-1 flex-col">
        <Link
          href={brandHref}
          className="truncate text-[0.65rem] font-bold tracking-[0.16em] text-rust uppercase transition-colors hover:text-coal"
          title={`See all from ${brand}`}
        >
          {brand}
        </Link>

        <Link href={`/shop/${product.slug}`} className="mt-1.5 block">
          <h3 className="font-display text-lg leading-tight tracking-[0.04em] text-coal transition-colors group-hover:text-rust">
            {product.name}
          </h3>
        </Link>

        {product.tagline ? (
          <p className="mt-1.5 line-clamp-1 text-sm leading-snug text-bone-dim">
            {product.tagline}
          </p>
        ) : null}

        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <Price
            amount={product.price}
            compareAt={product.compareAtPrice}
            size="md"
          />
          {product.colors.length > 0 ? (
            <div className="flex items-center gap-1" aria-label="Colours">
              {product.colors.slice(0, 4).map((color) => (
                <span
                  key={color.name}
                  title={color.name}
                  className="h-2.5 w-2.5 rounded-full ring-1 ring-ash-line"
                  style={{ backgroundColor: color.hex }}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
