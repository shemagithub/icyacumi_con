import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/container";
import { CultureIcon, type CultureIconName } from "@/components/culture-icons";
import { HeroAdsCarousel } from "@/components/hero-ads-carousel";
import { MarketplaceProductGrid } from "@/components/marketplace-product-grid";
import { NewsletterForm } from "@/components/newsletter-form";
import { QuickPaths } from "@/components/quick-paths";
import { formatEventDate, getAds, getEvents } from "@/lib/marketplace";
import { getCollections, getMostViewedProducts } from "@/lib/products";
import { formatPrice } from "@/lib/format";
import { site } from "@/lib/site";

const DROP_ICONS: Record<string, CultureIconName> = {
  "dust-season": "sun",
  "rodeo-nights": "mask",
  "bone-basics": "textile",
};

export default async function HomePage() {
  const [popular, events, featuredAds, collections] = await Promise.all([
    getMostViewedProducts(12),
    getEvents(),
    getAds(true),
    getCollections(),
  ]);

  const upcoming = events.filter((event) => event.ticketsLeft > 0).slice(0, 2);
  const heroAds =
    featuredAds.length > 0 ? featuredAds : await getAds(false);

  return (
    <>
      <HeroAdsCarousel ads={heroAds} />
      <Container className="py-12 lg:py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Popular</p>
            <h2 className="font-display mt-2 text-4xl tracking-[0.03em]">
              Trending now
            </h2>
            <p className="mt-2 max-w-md text-sm text-bone-dim">
              What people are opening on the floor right now.
            </p>
          </div>
          <Link
            href="/shop"
            className="craft-btn bg-rust px-5 py-3 text-[0.65rem] tracking-[0.16em] text-bone uppercase hover:bg-sand"
          >
            See all shop
          </Link>
        </div>
        <div className="mt-10">
          <MarketplaceProductGrid
            seed={popular}
            sort="views"
            limit={8}
            priorityCount={4}
          />
        </div>
      </Container>

      <Container className="pb-14 lg:pb-20">
        <QuickPaths />
      </Container>

      <Container className="pb-14 lg:pb-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">{site.madeIn}</p>
            <h2 className="font-display mt-2 text-4xl tracking-[0.03em]">
              Season drops
            </h2>
            <p className="mt-3 max-w-md text-sm text-bone-dim">
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
        <ul className="culture-stagger mt-8 grid gap-4 sm:grid-cols-3">
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
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Tickets</p>
              <h2 className="font-display mt-2 text-4xl tracking-[0.03em]">
                Upcoming nights
              </h2>
            </div>
            <Link
              href="/events"
              className="craft-btn bg-coal px-5 py-3 text-[0.65rem] tracking-[0.16em] text-bone uppercase hover:bg-indigo"
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
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <p className="eyebrow text-sand">Next drop</p>
              <h2 className="font-display mt-2 text-4xl tracking-[0.03em]">
                Stay on the list
              </h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-bone/70">
                Season drops, night markets, and floor news · no spam.
              </p>
              <div className="mt-6 [&_input]:text-bone [&_input]:placeholder:text-bone/40 [&_button]:text-bone [&_button:hover]:text-sand [&_form]:border-bone/30 [&_p]:text-sand">
                <NewsletterForm source="home" inputId="home-newsletter-email" />
              </div>
            </div>
            <div className="flex flex-wrap gap-4 text-xs tracking-[0.16em] uppercase">
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
