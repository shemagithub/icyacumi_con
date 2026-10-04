import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/container";
import { CultureIcon, type CultureIconName } from "@/components/culture-icons";
import { HeroAdsCarousel } from "@/components/hero-ads-carousel";
import { JsonLd } from "@/components/json-ld";
import { MarketplaceProductGrid } from "@/components/marketplace-product-grid";
import { NewsletterForm } from "@/components/newsletter-form";
import { PromoShuffle } from "@/components/promo-shuffle";
import { QuickPaths } from "@/components/quick-paths";
import { formatEventDate, getAds, getEvents } from "@/lib/marketplace";
import { getCollections, getDiscountedProducts, getMostViewedProducts } from "@/lib/products";
import { formatPrice } from "@/lib/format";
import { buildPageMetadata, collectionPageJsonLd } from "@/lib/seo";
import { site } from "@/lib/site";

const DROP_ICONS: Record<string, CultureIconName> = {
  "dust-season": "sun",
  "rodeo-nights": "mask",
  "bone-basics": "textile",
};

export async function generateMetadata(): Promise<Metadata> {
  const meta = buildPageMetadata({
    title: `${site.name} · Shop, events & ads`,
    description: site.description,
    path: "/",
    keywords: [
      site.name,
      "African fashion marketplace",
      "Rwanda streetwear",
      "event tickets",
      "multi-vendor shop",
      site.madeIn,
    ],
  });
  return {
    ...meta,
    title: { absolute: `${site.name} · Shop, events & ads` },
  };
}

export default async function HomePage() {
  const [popular, events, featuredAds, collections, promos] = await Promise.all([
    getMostViewedProducts(8),
    getEvents(),
    getAds(true),
    getCollections(),
    getDiscountedProducts(6),
  ]);

  const upcoming = events.filter((event) => event.ticketsLeft > 0).slice(0, 2);
  const heroAds =
    featuredAds.length > 0 ? featuredAds : await getAds(false);

  return (
    <>
      <JsonLd
        data={collectionPageJsonLd({
          name: `${site.name} marketplace`,
          description: site.description,
          path: "/",
          items: popular.slice(0, 12).map((product) => ({
            name: product.name,
            path: `/shop/${product.slug}`,
          })),
        })}
      />
      <HeroAdsCarousel ads={heroAds} />
      <Container className="py-10 sm:py-12 lg:py-16">
        <div className="flex flex-col items-center gap-5 text-center md:flex-row md:items-end md:justify-between md:text-left">
          <div className="max-w-md">
            <p className="eyebrow">Popular</p>
            <h2 className="font-display mt-2 text-[1.9rem] tracking-[0.03em] sm:text-4xl">
              Trending now
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-bone-dim">
              What people are opening on the floor right now.
            </p>
          </div>
          <Link
            href="/shop"
            className="craft-btn w-full max-w-[16rem] bg-rust px-5 py-3.5 text-[0.65rem] tracking-[0.16em] text-bone uppercase hover:bg-sand md:w-auto md:max-w-none md:py-3"
          >
            See all shop
          </Link>
        </div>
        <div className="store-board mt-7 sm:mt-8">
          <MarketplaceProductGrid
            seed={popular}
            sort="views"
            limit={8}
            priorityCount={4}
          />
        </div>
      </Container>

      <PromoShuffle products={promos} />

      <Container className="pb-14 lg:pb-20">
        <QuickPaths />
      </Container>

      <Container className="pb-14 lg:pb-16">
        <div className="flex flex-col items-center gap-4 text-center md:flex-row md:items-end md:justify-between md:text-left">
          <div className="max-w-md">
            <p className="eyebrow">{site.madeIn}</p>
            <h2 className="font-display mt-2 text-[1.9rem] tracking-[0.03em] sm:text-4xl">
              Season drops
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-bone-dim">
              Cultural collections · open a drop, then filter the floor.
            </p>
          </div>
          <Link
            href="/shop"
            className="text-xs tracking-[0.18em] text-bone-dim uppercase underline underline-offset-4 hover:text-rust"
          >
            Full shop
          </Link>
        </div>
        <ul className="culture-stagger mt-8 grid gap-3 sm:grid-cols-3">
          {collections.map((collection) => (
            <li key={collection.slug}>
              <Link
                href={`/collections/${collection.slug}`}
                className="path-tile craft-panel flex h-full flex-col gap-3 bg-ash/45 p-5 transition-colors hover:bg-ash/70"
              >
                <CultureIcon
                  name={DROP_ICONS[collection.slug] ?? "textile"}
                  className="h-6 w-6 text-rust"
                />
                <span className="font-display text-2xl tracking-[0.04em]">
                  {collection.name}
                </span>
                <span className="text-sm leading-relaxed text-bone-dim">
                  {collection.description}
                </span>
                <span className="mt-auto pt-2 text-[0.65rem] font-bold tracking-[0.16em] text-rust uppercase">
                  Browse drop →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>

      <section className="border-y-2 border-coal bg-ash/30 py-14 lg:py-20">
        <Container>
          <div className="flex flex-col items-center gap-5 text-center md:flex-row md:items-end md:justify-between md:text-left">
            <div>
              <p className="eyebrow">Tickets</p>
              <h2 className="font-display mt-2 text-[1.9rem] tracking-[0.03em] sm:text-4xl">
                Upcoming nights
              </h2>
            </div>
            <Link
              href="/events"
              className="craft-btn w-full max-w-[16rem] bg-coal px-5 py-3.5 text-[0.65rem] tracking-[0.16em] text-bone uppercase hover:bg-indigo md:w-auto md:max-w-none md:py-3"
            >
              All events
            </Link>
          </div>

          <ul className="mt-10 grid gap-6 lg:grid-cols-2">
            {upcoming.map((event) => (
              <li key={event.id}>
                <Link
                  href={`/events/${event.slug}`}
                  className="path-tile craft-panel flex gap-4 bg-bone/95 p-4 sm:p-5"
                >
                  <div className="relative aspect-[4/5] w-24 shrink-0 overflow-hidden bg-ash sm:w-28">
                    <Image
                      src={event.image.src}
                      alt=""
                      fill
                      sizes="112px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="eyebrow">
                      {formatEventDate(event.date)} · {event.city}
                    </p>
                    <h3 className="font-display mt-2 text-2xl tracking-[0.04em]">
                      {event.title}
                    </h3>
                    <p className="mt-2 text-sm tabular-nums text-bone-dim">
                      From {formatPrice(event.price)}
                    </p>
                    <span className="mt-4 inline-block text-[0.65rem] font-bold tracking-[0.16em] text-rust uppercase">
                      Get tickets →
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>
      <section className="border-t border-ash-line bg-coal py-14 text-bone lg:py-16">
        <Container>
          <div className="grid gap-10 text-center lg:grid-cols-[1.1fr_0.9fr] lg:items-end lg:text-left">
            <div>
              <p className="eyebrow text-sand">Next drop</p>
              <h2 className="font-display mt-2 text-[1.9rem] tracking-[0.03em] sm:text-4xl">
                Stay on the list
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-bone/70 lg:mx-0">
                Season drops, night markets, and floor news · no spam.
              </p>
              <div className="mt-6 [&_input]:text-bone [&_input]:placeholder:text-bone/40 [&_button]:text-bone [&_button:hover]:text-sand [&_form]:border-bone/30 [&_p]:text-sand">
                <NewsletterForm source="home" inputId="home-newsletter-email" />
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-4 text-xs tracking-[0.16em] uppercase lg:justify-start">
              <Link href="/heritage" className="underline underline-offset-4 hover:text-sand">
                Heritage
              </Link>
              <Link href="/art" className="underline underline-offset-4 hover:text-sand">
                Art
              </Link>
              <Link href="/about" className="underline underline-offset-4 hover:text-sand">
                About
              </Link>
              <Link href="/brand-signup" className="underline underline-offset-4 hover:text-sand">
                Become a brand
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
