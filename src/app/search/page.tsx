import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/container";
import { CultureIcon } from "@/components/culture-icons";
import { JsonLd } from "@/components/json-ld";
import { formatPrice } from "@/lib/format";
import {
  breadcrumbJsonLd,
  buildPageMetadata,
  collectionPageJsonLd,
} from "@/lib/seo";
import { searchCatalog } from "@/lib/site-search";
import { site } from "@/lib/site";

type SearchParams = Promise<{ q?: string | string[] }>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  if (!q) {
    return buildPageMetadata({
      title: "Search",
      description: `Search products, brands, events, and ads on ${site.name}.`,
      path: "/search",
      keywords: [site.name, "search", "African fashion", "events", "marketplace"],
    });
  }
  return buildPageMetadata({
    title: `Search “${q}”`,
    description: `Results for “${q}” on ${site.name} · products, brands, events, and ads.`,
    path: `/search?q=${encodeURIComponent(q)}`,
    keywords: [q, site.name, "search", site.madeIn],
  });
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 80) : "";
  const results = await searchCatalog(q);
  const total =
    results.products.length +
    results.brands.length +
    results.events.length +
    results.ads.length;

  const listItems = [
    ...results.products.map((product) => ({
      name: product.name,
      path: `/shop/${product.slug}`,
    })),
    ...results.brands.map((brand) => ({
      name: brand.name,
      path: `/brands/${brand.slug}`,
    })),
    ...results.events.map((event) => ({
      name: event.title,
      path: `/events/${event.slug}`,
    })),
  ].slice(0, 20);

  return (
    <Container className="py-10 lg:py-14">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Search", path: "/search" },
          ]),
          ...(q
            ? [
                collectionPageJsonLd({
                  name: `Search results for “${q}”`,
                  description: `${total} results on ${site.name}`,
                  path: `/search?q=${encodeURIComponent(q)}`,
                  items: listItems,
                }),
              ]
            : []),
        ]}
      />

      <header className="max-w-2xl">
        <p className="eyebrow">{site.madeIn}</p>
        <h1 className="font-display mt-2 text-5xl tracking-[0.03em] lg:text-6xl">
          Search
        </h1>
        <p className="mt-4 text-base text-bone-dim">
          Find products, brands, events, and ads across the marketplace.
        </p>
      </header>

      <form action="/search" method="get" className="mt-8 max-w-xl" role="search">
        <label className="sr-only" htmlFor="site-search-q">
          Search {site.name}
        </label>
        <div className="flex gap-2">
          <input
            id="site-search-q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Search products, brands, events…"
            className="field-input flex-1"
            autoComplete="off"
          />
          <button
            type="submit"
            className="craft-btn shrink-0 bg-rust px-5 py-3 text-xs tracking-[0.16em] text-bone uppercase"
          >
            Search
          </button>
        </div>
      </form>

      {!q ? (
        <p className="mt-10 text-sm text-bone-dim">
          Type a query to browse the catalog. Popular paths:{" "}
          <Link href="/shop" className="underline hover:text-rust">
            Shop
          </Link>
          ,{" "}
          <Link href="/brands" className="underline hover:text-rust">
            Brands
          </Link>
          ,{" "}
          <Link href="/events" className="underline hover:text-rust">
            Events
          </Link>
          .
        </p>
      ) : (
        <div className="mt-10 space-y-12">
          <p className="text-sm text-bone-dim">
            {total === 0
              ? `No results for “${q}”.`
              : `${total} result${total === 1 ? "" : "s"} for “${q}”.`}
          </p>

          {results.products.length > 0 ? (
            <section>
              <h2 className="font-display text-2xl tracking-[0.04em]">Products</h2>
              <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {results.products.map((product) => (
                  <li key={product.id}>
                    <Link
                      href={`/shop/${product.slug}`}
                      className="craft-panel block overflow-hidden bg-bone/90 transition-colors hover:bg-ash/40"
                    >
                      <div className="relative aspect-[4/5] bg-ash">
                        {product.images[0] ? (
                          <Image
                            src={product.images[0].src}
                            alt={product.images[0].alt || product.name}
                            fill
                            sizes="(min-width: 1024px) 20vw, 45vw"
                            className="object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="p-4">
                        <p className="font-display text-lg tracking-[0.03em]">
                          {product.name}
                        </p>
                        <p className="mt-1 text-xs tracking-[0.12em] text-bone-dim uppercase">
                          {product.brandName ?? site.name}
                        </p>
                        <p className="mt-2 text-sm tabular-nums">
                          {formatPrice(product.price)}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {results.brands.length > 0 ? (
            <section>
              <h2 className="font-display text-2xl tracking-[0.04em]">Brands</h2>
              <ul className="mt-6 space-y-3">
                {results.brands.map((brand) => (
                  <li key={brand.id}>
                    <Link
                      href={`/brands/${brand.slug}`}
                      className="craft-panel flex items-start gap-3 bg-bone/90 p-4 transition-colors hover:bg-ash/40"
                    >
                      <CultureIcon name="necklace" className="mt-0.5 h-5 w-5 text-rust" />
                      <span>
                        <span className="block font-display text-lg tracking-[0.03em]">
                          {brand.name}
                        </span>
                        <span className="mt-1 block text-sm text-bone-dim">
                          {brand.shortBio}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {results.events.length > 0 ? (
            <section>
              <h2 className="font-display text-2xl tracking-[0.04em]">Events</h2>
              <ul className="mt-6 space-y-3">
                {results.events.map((event) => (
                  <li key={event.id}>
                    <Link
                      href={`/events/${event.slug}`}
                      className="craft-panel block bg-bone/90 p-4 transition-colors hover:bg-ash/40"
                    >
                      <p className="font-display text-lg tracking-[0.03em]">
                        {event.title}
                      </p>
                      <p className="mt-1 text-sm text-bone-dim">
                        {event.city} · {event.venue}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {results.ads.length > 0 ? (
            <section>
              <h2 className="font-display text-2xl tracking-[0.04em]">Ads</h2>
              <ul className="mt-6 space-y-3">
                {results.ads.map((ad) => (
                  <li key={ad.id}>
                    <Link
                      href={ad.ctaHref || "/ads"}
                      className="craft-panel block bg-bone/90 p-4 transition-colors hover:bg-ash/40"
                    >
                      <p className="font-display text-lg tracking-[0.03em]">
                        {ad.title}
                      </p>
                      <p className="mt-1 text-sm text-bone-dim">{ad.summary}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}
    </Container>
  );
}
