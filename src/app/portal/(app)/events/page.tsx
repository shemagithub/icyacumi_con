"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminPagination } from "@/components/admin-pagination";
import { EventsCalendar } from "@/components/events-calendar";
import { formatPrice } from "@/lib/format";
import { usePagination } from "@/lib/pagination";
import { site } from "@/lib/site";
import type { MarketEvent } from "@/lib/types";

export default function PortalEventsPage() {
  const [events, setEvents] = useState<MarketEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const pagination = usePagination(events);

  const load = useCallback(async () => {
    const response = await fetch("/api/portal/events", { credentials: "include" });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Failed to load");
      return;
    }
    setEvents(data.events ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Events</h1>
        <p className="mt-1 text-sm text-[var(--portal-muted)]">
          Ticketed events for your brand are created by the {site.name} admin.
          Here you can track dates, capacity, and ticket sales.
        </p>
      </header>

      <div className="rounded-2xl border border-[var(--portal-line)] bg-[var(--portal-bg)] px-4 py-3 text-sm text-[var(--portal-muted)]">
        Need a new event listed? Email{" "}
        <a href={`mailto:${site.email}`} className="font-semibold underline">
          {site.email}
        </a>{" "}
        · only the platform admin publishes events.
      </div>

      {error ? (
        <p className="text-sm text-[var(--portal-accent)]">{error}</p>
      ) : null}

      <EventsCalendar events={events} tone="portal" />

      <section className="portal-card overflow-hidden">
        <div className="border-b border-[var(--portal-line)] px-5 py-4">
          <p className="text-sm font-semibold">Your events</p>
          <p className="text-xs text-[var(--portal-muted)]">
            {events.length} published by admin
          </p>
        </div>
        <ul className="divide-y divide-[var(--portal-line)]">
          {pagination.items.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-start justify-between gap-3 px-5 py-4"
            >
              <div>
                <p className="font-semibold">{item.title}</p>
                <p className="mt-1 text-sm text-[var(--portal-muted)]">
                  {item.date} · {item.city} · {formatPrice(item.price)}
                </p>
                <span className="portal-badge portal-badge--info mt-2">
                  {item.ticketsLeft} / {item.capacity} left
                </span>
              </div>
              <Link
                href={`/events/${item.slug}`}
                className="portal-btn portal-btn--ghost !py-2 !text-xs"
              >
                View public page
              </Link>
            </li>
          ))}
          {events.length === 0 ? (
            <li className="px-5 py-10 text-sm text-[var(--portal-muted)]">
              No events assigned to your brand yet.
            </li>
          ) : null}
        </ul>
        <AdminPagination
          page={pagination.page}
          pageSize={pagination.pageSize}
          total={pagination.total}
          totalPages={pagination.totalPages}
          start={pagination.start}
          end={pagination.end}
          onPageChange={pagination.setPage}
          onPageSizeChange={pagination.setPageSize}
        />
      </section>
    </div>
  );
}
