import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/container";
import { EventsViewTabs } from "@/components/events-view-tabs";
import { formatEventDate, getEvents } from "@/lib/marketplace";
import { formatPrice } from "@/lib/format";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Events",
  description: `Buy tickets to ${site.name} marketplace events.`,
  alternates: { canonical: "/events" },
};

export default async function EventsPage() {
  const events = await getEvents();

  return (
    <Container className="py-10 lg:py-14">
      <header className="max-w-2xl">
        <p className="eyebrow">Tickets</p>
        <h1 className="font-display mt-2 text-5xl tracking-[0.03em] lg:text-6xl">
          Events
        </h1>
        <p className="mt-4 text-base text-bone-dim">
          Markets, previews, and nights · grab a ticket, meet the brands.
        </p>
      </header>

      <EventsViewTabs active="events" />

      <ul className="mt-8 grid gap-8 lg:grid-cols-2">
        {events.map((event) => (
          <li key={event.id}>
            <Link
              href={`/events/${event.slug}`}
              className="culture-card craft-panel group block overflow-hidden bg-bone/90"
            >
              <div className="craft-frame craft-frame--soft relative aspect-[16/10] overflow-hidden bg-ash">
                <Image
                  src={event.image.src}
                  alt={event.image.alt}
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </div>
              <div className="p-6">
                <p className="eyebrow">
                  {formatEventDate(event.date)} · {event.city}
                </p>
                <h2 className="font-display mt-2 text-3xl tracking-[0.04em]">
                  {event.title}
                </h2>
                <p className="mt-2 text-sm text-bone-dim">{event.summary}</p>
                <div className="mt-5 flex items-center justify-between gap-3 text-sm">
                  <span className="tabular-nums">{formatPrice(event.price)}</span>
                  <span className="text-xs tracking-[0.14em] text-bone-dim uppercase">
                    {event.ticketsLeft > 0
                      ? `${event.ticketsLeft} left`
                      : "Sold out"}
                  </span>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </Container>
  );
}
