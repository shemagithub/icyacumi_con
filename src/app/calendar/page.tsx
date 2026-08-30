import type { Metadata } from "next";
import { Container } from "@/components/container";
import { EventsCalendar } from "@/components/events-calendar";
import { EventsViewTabs } from "@/components/events-view-tabs";
import { getEvents } from "@/lib/marketplace";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Calendar",
  description: `See every ${site.name} event by day on the calendar.`,
  alternates: { canonical: "/calendar" },
};

export default async function CalendarPage() {
  const events = await getEvents();

  return (
    <Container className="py-10 lg:py-14">
      <header className="max-w-2xl">
        <p className="eyebrow">Tickets</p>
        <h1 className="font-display mt-2 text-5xl tracking-[0.03em] lg:text-6xl">
          Calendar
        </h1>
        <p className="mt-4 text-base text-bone-dim">
          Click any day to see every event happening then · time, venue, tickets,
          and full details.
        </p>
      </header>

      <EventsViewTabs active="calendar" />

      <div className="mt-8">
        <EventsCalendar events={events} tone="storefront" showPublicLinks />
      </div>
    </Container>
  );
}
