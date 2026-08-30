import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/container";
import { CultureIcon, type CultureIconName } from "@/components/culture-icons";
import { MarketplaceProductGrid } from "@/components/marketplace-product-grid";
import { TicketBuyButton } from "@/components/ticket-buy-button";
import {
  formatEventDate,
  getAllEventSlugs,
  getEventBySlug,
  getVendorById,
} from "@/lib/marketplace";
import { formatPrice } from "@/lib/format";
import { getProducts } from "@/lib/products";
import { site } from "@/lib/site";

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  const slugs = await getAllEventSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return { title: "Event" };
  return {
    title: event.title,
    description: event.summary,
  };
}

export default async function EventDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();

  const brands = (
    await Promise.all(event.vendorIds.map((id) => getVendorById(id)))
  ).filter(Boolean);

  const floorProducts = (
    await Promise.all(
      event.vendorIds.map((vendorId) =>
        getProducts({ vendor: vendorId, sort: "views" }),
      ),
    )
  )
    .flat()
    .filter(
      (product, index, list) =>
        list.findIndex((entry) => entry.id === product.id) === index,
    )
    .slice(0, 8);

  return (
    <Container className="py-10 lg:py-14">
      <nav className="text-xs tracking-[0.14em] text-bone-dim uppercase">
        <Link href="/events" className="hover:text-rust">
          Events
        </Link>
        <span aria-hidden> / </span>
        <span className="text-coal">{event.title}</span>
      </nav>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
        <div className="craft-frame craft-frame--soft relative aspect-[4/5] overflow-hidden bg-ash lg:aspect-[5/6]">
          <Image
            src={event.image.src}
            alt={event.image.alt}
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </div>

        <div>
          <p className="eyebrow">{site.madeIn}</p>
          <h1 className="font-display mt-3 text-4xl tracking-[0.03em] lg:text-5xl">
            {event.title}
          </h1>
          <p className="mt-4 text-base text-bone-dim">{event.summary}</p>

          <dl className="mt-8 space-y-3 border-y border-ash-line py-6 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-bone-dim">When</dt>
              <dd>
                {formatEventDate(event.date)} · {event.time}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-bone-dim">Where</dt>
              <dd>
                {event.venue}, {event.city}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-bone-dim">Ticket</dt>
              <dd className="tabular-nums">{formatPrice(event.price)}</dd>
            </div>
          </dl>

          <div className="mt-8">
            <TicketBuyButton event={event} />
          </div>
        </div>
      </div>

      {brands.length > 0 ? (
        <section className="mt-16 border-t border-ash-line pt-12">
          <p className="eyebrow">Event floor</p>
          <h2 className="font-display mt-2 text-3xl tracking-[0.03em] lg:text-4xl">
            Brands on the night
          </h2>
          <p className="mt-3 max-w-xl text-sm text-bone-dim">
            Meet the makers on the floor · then bag their pieces with your ticket
            in one checkout.
          </p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {brands.map((brand) =>
              brand ? (
                <li key={brand.id}>
                  <Link
                    href={`/brands/${brand.slug}`}
                    className="craft-panel flex h-full flex-col gap-2 bg-bone/90 p-5 transition-colors hover:bg-ash/40"
                  >
                    <CultureIcon
                      name={brand.icon as CultureIconName}
                      className="h-5 w-5 text-rust"
                    />
                    <span className="font-display text-xl tracking-[0.04em]">
                      {brand.name}
                    </span>
                    <span className="text-sm text-bone-dim">{brand.shortBio}</span>
                    <span className="mt-auto pt-3 text-xs tracking-[0.14em] text-bone-dim uppercase">
                      {brand.location} · Shop brand →
                    </span>
                  </Link>
                </li>
              ) : null,
            )}
          </ul>
        </section>
      ) : null}

      {floorProducts.length > 0 ? (
        <section className="mt-14">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Shop the night</p>
              <h2 className="font-display mt-2 text-3xl tracking-[0.03em]">
                Pieces from the floor
              </h2>
            </div>
            <Link
              href="/shop"
              className="text-xs tracking-[0.16em] text-bone-dim uppercase underline underline-offset-4 hover:text-rust"
            >
              Full shop
            </Link>
          </div>
          <div className="mt-8">
            <MarketplaceProductGrid
              seed={floorProducts}
              sort="views"
              limit={8}
              priorityCount={2}
            />
          </div>
        </section>
      ) : null}
    </Container>
  );
}
