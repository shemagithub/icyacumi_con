"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatPrice } from "@/lib/format";
import type { MarketEvent } from "@/lib/types";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function toDateKey(value: string | Date): string {
  if (typeof value === "string") return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

function startOfMonth(year: number, month: number): Date {
  return new Date(year, month, 1);
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function formatMonthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function formatLongDate(iso: string): string {
  const date = new Date(`${iso}T12:00:00`);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function buildMonthCells(year: number, month: number): (number | null)[] {
  const first = startOfMonth(year, month);
  const total = daysInMonth(year, month);
  const leading = first.getDay();
  const cells: (number | null)[] = Array.from({ length: leading }, () => null);
  for (let day = 1; day <= total; day += 1) cells.push(day);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export type EventsCalendarProps = {
  events: MarketEvent[];
  /** Visual theme for portal vs storefront. */
  tone?: "portal" | "storefront";
  /** Called when a day is selected (ISO date). Useful to prefill create forms. */
  onSelectDate?: (date: string) => void;
  /** Show public event links / ticket counts. */
  showPublicLinks?: boolean;
  className?: string;
};

export function EventsCalendar({
  events,
  tone = "portal",
  onSelectDate,
  showPublicLinks = false,
  className = "",
}: EventsCalendarProps) {
  const todayKey = toDateKey(new Date());
  const initial = useMemo(() => {
    const firstUpcoming = [...events]
      .map((event) => toDateKey(event.date))
      .sort()
      .find((date) => date >= todayKey);
    const seed = firstUpcoming ?? todayKey;
    const [y, m] = seed.split("-").map(Number);
    return { year: y, month: m - 1, selected: seed };
  }, [events, todayKey]);

  const [year, setYear] = useState(initial.year);
  const [month, setMonth] = useState(initial.month);
  const [selected, setSelected] = useState<string | null>(initial.selected);
  const [didSync, setDidSync] = useState(false);

  useEffect(() => {
    if (didSync || events.length === 0) return;
    setYear(initial.year);
    setMonth(initial.month);
    setSelected(initial.selected);
    setDidSync(true);
  }, [didSync, events.length, initial]);

  const byDate = useMemo(() => {
    const map = new Map<string, MarketEvent[]>();
    for (const event of events) {
      const key = toDateKey(event.date);
      const list = map.get(key) ?? [];
      list.push(event);
      map.set(key, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.time.localeCompare(b.time));
    }
    return map;
  }, [events]);

  const cells = useMemo(() => buildMonthCells(year, month), [year, month]);
  const dayEvents = selected ? (byDate.get(selected) ?? []) : [];

  function shiftMonth(delta: number) {
    const next = new Date(year, month + delta, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
  }

  function selectDay(day: number) {
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelected(key);
    onSelectDate?.(key);
  }

  const isPortal = tone === "portal";

  return (
    <div
      className={`grid gap-4 lg:grid-cols-[1.15fr_0.85fr] ${className}`}
      data-tone={tone}
    >
      <div
        className={
          isPortal
            ? "portal-card overflow-hidden"
            : "craft-panel overflow-hidden bg-bone/90"
        }
      >
        <div
          className={`flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-5 ${
            isPortal ? "border-[var(--portal-line)]" : "border-ash-line"
          }`}
        >
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className={
              isPortal
                ? "portal-btn portal-btn--ghost !px-3 !py-2 !text-xs"
                : "craft-btn-ghost px-3 py-2 text-xs tracking-[0.14em] uppercase"
            }
            aria-label="Previous month"
          >
            ‹
          </button>
          <h2
            className={
              isPortal
                ? "text-sm font-semibold tracking-tight"
                : "font-display text-xl tracking-[0.04em]"
            }
          >
            {formatMonthLabel(year, month)}
          </h2>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className={
              isPortal
                ? "portal-btn portal-btn--ghost !px-3 !py-2 !text-xs"
                : "craft-btn-ghost px-3 py-2 text-xs tracking-[0.14em] uppercase"
            }
            aria-label="Next month"
          >
            ›
          </button>
        </div>

        <div className="grid grid-cols-7 gap-px bg-transparent p-3 sm:p-4">
          {WEEKDAYS.map((label) => (
            <div
              key={label}
              className={`pb-2 text-center text-[0.65rem] font-semibold tracking-[0.12em] uppercase ${
                isPortal ? "text-[var(--portal-muted)]" : "text-bone-dim"
              }`}
            >
              {label}
            </div>
          ))}

          {cells.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }

            const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const count = byDate.get(key)?.length ?? 0;
            const isSelected = selected === key;
            const isToday = key === todayKey;

            return (
              <button
                key={key}
                type="button"
                onClick={() => selectDay(day)}
                aria-pressed={isSelected}
                aria-label={`${formatLongDate(key)}${count ? `, ${count} event${count === 1 ? "" : "s"}` : ""}`}
                className={`relative flex aspect-square flex-col items-center justify-center rounded-lg text-sm transition-colors ${
                  isSelected
                    ? isPortal
                      ? "bg-[var(--portal-accent)] text-white"
                      : "bg-rust text-bone"
                    : isToday
                      ? isPortal
                        ? "bg-[var(--portal-bg)] font-semibold ring-1 ring-[var(--portal-accent)]"
                        : "bg-ash/60 font-semibold ring-1 ring-rust"
                      : isPortal
                        ? "hover:bg-[var(--portal-bg)]"
                        : "hover:bg-ash/50"
                }`}
              >
                <span>{day}</span>
                {count > 0 ? (
                  <span
                    className={`mt-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[0.6rem] font-bold tabular-nums ${
                      isSelected
                        ? "bg-white/25 text-inherit"
                        : isPortal
                          ? "bg-[var(--portal-accent)]/15 text-[var(--portal-accent)]"
                          : "bg-rust/15 text-rust"
                    }`}
                  >
                    {count}
                  </span>
                ) : (
                  <span className="mt-0.5 h-4" aria-hidden />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <aside
        className={
          isPortal
            ? "portal-card flex flex-col overflow-hidden"
            : "craft-panel flex flex-col overflow-hidden bg-bone/90"
        }
      >
        <div
          className={`border-b px-5 py-4 ${
            isPortal ? "border-[var(--portal-line)]" : "border-ash-line"
          }`}
        >
          <p
            className={
              isPortal
                ? "text-sm font-semibold"
                : "font-display text-xl tracking-[0.04em]"
            }
          >
            {selected ? formatLongDate(selected) : "Pick a day"}
          </p>
          <p
            className={`mt-1 text-xs ${
              isPortal ? "text-[var(--portal-muted)]" : "text-bone-dim"
            }`}
          >
            {selected
              ? dayEvents.length
                ? `${dayEvents.length} event${dayEvents.length === 1 ? "" : "s"} this day`
                : "No events on this day"
              : "Select a date on the calendar to see details."}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {dayEvents.length > 0 ? (
            <ul
              className={`divide-y ${
                isPortal ? "divide-[var(--portal-line)]" : "divide-ash-line"
              }`}
            >
              {dayEvents.map((event) => (
                <li key={event.id} className="px-5 py-4">
                  <div className="flex gap-3">
                    <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-md bg-ash">
                      <Image
                        src={event.image.src}
                        alt={event.image.alt}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold leading-snug">{event.title}</p>
                      <p
                        className={`mt-1 text-sm ${
                          isPortal ? "text-[var(--portal-muted)]" : "text-bone-dim"
                        }`}
                      >
                        {event.time} · {event.venue}, {event.city}
                      </p>
                      <p
                        className={`mt-2 text-sm leading-relaxed ${
                          isPortal ? "text-[var(--portal-ink)]" : "text-coal"
                        }`}
                      >
                        {event.summary}
                      </p>
                      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                        <div>
                          <dt
                            className={
                              isPortal ? "text-[var(--portal-muted)]" : "text-bone-dim"
                            }
                          >
                            Ticket
                          </dt>
                          <dd className="font-medium tabular-nums">
                            {formatPrice(event.price)}
                          </dd>
                        </div>
                        <div>
                          <dt
                            className={
                              isPortal ? "text-[var(--portal-muted)]" : "text-bone-dim"
                            }
                          >
                            Seats
                          </dt>
                          <dd className="font-medium tabular-nums">
                            {event.ticketsLeft} / {event.capacity} left
                          </dd>
                        </div>
                      </dl>
                      {showPublicLinks ? (
                        <Link
                          href={`/events/${event.slug}`}
                          className={
                            isPortal
                              ? "portal-btn portal-btn--ghost mt-3 !py-2 !text-xs"
                              : "craft-btn mt-3 inline-flex bg-rust px-4 py-2 text-[0.65rem] tracking-[0.14em] text-bone uppercase"
                          }
                        >
                          Full details
                        </Link>
                      ) : (
                        <Link
                          href={`/events/${event.slug}`}
                          className="portal-btn portal-btn--ghost mt-3 !py-2 !text-xs"
                        >
                          View public page
                        </Link>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div
              className={`px-5 py-10 text-sm ${
                isPortal ? "text-[var(--portal-muted)]" : "text-bone-dim"
              }`}
            >
              {selected
                ? isPortal
                  ? "Nothing scheduled. Use the form to add an event on this date."
                  : "No events on this day. Try another date or browse the list below."
                : "Choose a day to inspect its events."}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
