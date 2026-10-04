"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { AdminPagination } from "@/components/admin-pagination";
import { CreditsEditor } from "@/components/credits-editor";
import { ExportPdfButton } from "@/components/export-pdf-button";
import { parseCredits } from "@/lib/credits";
import { formatPrice } from "@/lib/format";
import { usePagination } from "@/lib/pagination";
import type { Credit } from "@/lib/types";

type BrandOption = { id: string; name: string; slug: string };

type EventRow = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  city: string;
  venue: string;
  date: string;
  time: string;
  price: number;
  ticketsLeft: number;
  capacity: number;
  imageSrc: string;
  brandId: string;
  brand: { id: string; name: string; slug: string };
  credits?: Credit[];
};

const EMPTY_FORM = {
  brandId: "",
  title: "",
  summary: "",
  date: new Date().toISOString().slice(0, 10),
  time: "18:00",
  venue: "",
  city: "Kigali",
  price: "",
  capacity: "100",
  ticketsLeft: "",
  imageSrc: "/editorial/look-01.png",
  credits: [] as Credit[],
};

export default function AdminEventsPage() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const pagination = usePagination(events);

  const load = useCallback(async () => {
    const [eventsRes, brandsRes] = await Promise.all([
      fetch("/api/admin/events", { credentials: "include" }),
      fetch("/api/admin/brands", { credentials: "include" }),
    ]);
    const eventsData = await eventsRes.json();
    const brandsData = await brandsRes.json();
    if (!eventsRes.ok) {
      setError(eventsData.error ?? "Failed to load events");
      return;
    }
    if (!brandsRes.ok) {
      setError(brandsData.error ?? "Failed to load brands");
      return;
    }
    setEvents(eventsData.events ?? []);
    const brandList = (brandsData.brands as BrandOption[]) ?? [];
    setBrands(brandList);
    setForm((prev) =>
      prev.brandId || !brandList[0]
        ? prev
        : { ...prev, brandId: brandList[0].id },
    );
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function resetForm() {
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      brandId: brands[0]?.id ?? "",
    });
  }

  function startEdit(item: EventRow) {
    setEditingId(item.id);
    setForm({
      brandId: item.brandId || item.brand.id,
      title: item.title,
      summary: item.summary ?? "",
      date: item.date,
      time: item.time || "18:00",
      venue: item.venue ?? "",
      city: item.city ?? "",
      price: String(item.price),
      capacity: String(item.capacity),
      ticketsLeft: String(item.ticketsLeft),
      imageSrc: item.imageSrc || "/editorial/look-01.png",
      credits: item.credits ?? [],
    });
    setMessage(null);
    setError(null);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);
    const payload = {
      brandId: form.brandId,
      title: form.title,
      summary: form.summary,
      date: form.date,
      time: form.time,
      venue: form.venue,
      city: form.city,
      price: Math.round(Number(form.price)),
      capacity: Number(form.capacity),
      ticketsLeft:
        form.ticketsLeft === ""
          ? Number(form.capacity)
          : Number(form.ticketsLeft),
      imageSrc: form.imageSrc,
      credits: parseCredits(form.credits),
    };

    try {
      const response = await fetch(
        editingId ? `/api/admin/events/${editingId}` : "/api/admin/events",
        {
          method: editingId ? "PATCH" : "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Could not save event.");
        return;
      }
      setMessage(editingId ? "Event updated." : "Event published.");
      resetForm();
      await load();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setPending(false);
    }
  }

  async function remove(item: EventRow) {
    if (!confirm(`Delete ${item.title}?`)) return;
    setError(null);
    const response = await fetch(`/api/admin/events/${item.id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "Could not delete event.");
      return;
    }
    if (editingId === item.id) resetForm();
    setMessage("Event deleted.");
    await load();
  }

  const exportRows = useMemo(
    () =>
      events.map((item) => ({
        title: item.title,
        brand: item.brand.name,
        city: item.city,
        date: item.date,
        price: item.price,
        tickets: `${item.ticketsLeft}/${item.capacity}`,
        slug: item.slug,
      })),
    [events],
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Events</h1>
          <p className="mt-1 text-sm text-[var(--portal-muted)]">
            Only super admin creates and manages ticketed events. Assign each
            event to a brand so ticket sales credit their portal.
          </p>
        </div>
        <ExportPdfButton
          title="Events"
          columns={[
            { key: "title", label: "Title", width: 140 },
            { key: "brand", label: "Brand", width: 100 },
            { key: "city", label: "City", width: 70 },
            { key: "date", label: "Date", width: 70 },
            { key: "price", label: "Price (RWF)", width: 70 },
            { key: "tickets", label: "Tickets left", width: 70 },
            { key: "slug", label: "Slug", width: 100 },
          ]}
          rows={exportRows}
        />
      </header>

      {message ? (
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-2xl bg-orange-50 px-4 py-3 text-sm text-[var(--portal-accent)]">
          {error}
        </p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
        <form onSubmit={onSubmit} className="portal-card space-y-3 p-5 sm:p-6">
          <h2 className="text-sm font-semibold">
            {editingId ? "Edit event" : "New event"}
          </h2>

          <label className="block">
            <span className="mb-1.5 block text-xs text-[var(--portal-muted)]">
              Brand
            </span>
            <select
              required
              value={form.brandId}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, brandId: event.target.value }))
              }
              className="portal-input appearance-none"
            >
              {brands.length === 0 ? (
                <option value="">No brands available</option>
              ) : null}
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs text-[var(--portal-muted)]">
              Title
            </span>
            <input
              required
              value={form.title}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, title: event.target.value }))
              }
              className="portal-input"
              placeholder="Night market showcase"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs text-[var(--portal-muted)]">
              Summary
            </span>
            <input
              value={form.summary}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, summary: event.target.value }))
              }
              className="portal-input"
              placeholder="Short public description"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1.5 block text-xs text-[var(--portal-muted)]">
                Date
              </span>
              <input
                required
                type="date"
                value={form.date}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, date: event.target.value }))
                }
                className="portal-input"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs text-[var(--portal-muted)]">
                Time
              </span>
              <input
                type="time"
                value={form.time}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, time: event.target.value }))
                }
                className="portal-input"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-xs text-[var(--portal-muted)]">
              Venue
            </span>
            <input
              required
              value={form.venue}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, venue: event.target.value }))
              }
              className="portal-input"
              placeholder="Venue name"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs text-[var(--portal-muted)]">
              City
            </span>
            <input
              required
              value={form.city}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, city: event.target.value }))
              }
              className="portal-input"
              placeholder="Kigali"
            />
          </label>

          <div className="grid grid-cols-3 gap-3">
            <label className="block">
              <span className="mb-1.5 block text-xs text-[var(--portal-muted)]">
                Ticket (RWF)
              </span>
              <input
                required
                type="number"
                min={0}
                value={form.price}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, price: event.target.value }))
                }
                className="portal-input"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs text-[var(--portal-muted)]">
                Capacity
              </span>
              <input
                required
                type="number"
                min={1}
                value={form.capacity}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, capacity: event.target.value }))
                }
                className="portal-input"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs text-[var(--portal-muted)]">
                Tickets left
              </span>
              <input
                type="number"
                min={0}
                value={form.ticketsLeft}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    ticketsLeft: event.target.value,
                  }))
                }
                className="portal-input"
                placeholder="= capacity"
              />
            </label>
          </div>

          <CreditsEditor
            value={form.credits}
            onChange={(credits) => setForm((prev) => ({ ...prev, credits }))}
          />

          <label className="block">
            <span className="mb-1.5 block text-xs text-[var(--portal-muted)]">
              Image path
            </span>
            <input
              value={form.imageSrc}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, imageSrc: event.target.value }))
              }
              className="portal-input"
              placeholder="/editorial/look-01.png"
            />
          </label>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="submit"
              disabled={pending || !form.brandId}
              className="portal-btn portal-btn--accent disabled:opacity-60"
            >
              {pending
                ? "Saving…"
                : editingId
                  ? "Save changes"
                  : "Publish event"}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="portal-btn portal-btn--ghost"
              >
                Cancel edit
              </button>
            ) : null}
          </div>
        </form>

        <section className="portal-card overflow-hidden">
          <div className="border-b border-[var(--portal-line)] px-5 py-4">
            <p className="text-sm font-semibold">All events</p>
            <p className="text-xs text-[var(--portal-muted)]">
              {events.length} published
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
                  <p className="text-xs text-[var(--portal-muted)]">
                    {item.brand.name} · {item.city} · {item.date} ·{" "}
                    {formatPrice(item.price)}
                  </p>
                  <p className="mt-1 text-xs text-[var(--portal-muted)]">
                    {item.ticketsLeft}/{item.capacity} tickets left
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/events/${item.slug}`}
                    className="portal-btn portal-btn--ghost !py-2 !text-xs"
                  >
                    View
                  </Link>
                  <button
                    type="button"
                    onClick={() => startEdit(item)}
                    className="portal-btn portal-btn--ghost !py-2 !text-xs"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void remove(item)}
                    className="portal-btn portal-btn--ghost !py-2 !text-xs text-[var(--portal-accent)]"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
            {events.length === 0 ? (
              <li className="px-5 py-10 text-sm text-[var(--portal-muted)]">
                No events yet. Publish the first one from the form.
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
    </div>
  );
}
