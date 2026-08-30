"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { AdminPagination } from "@/components/admin-pagination";
import { usePagination } from "@/lib/pagination";
import type { AdCreative } from "@/lib/types";

const LOOKS = [
  "/editorial/look-01.png",
  "/editorial/look-02.png",
  "/editorial/look-03.png",
  "/editorial/look-04.png",
];

export default function PortalAdsPage() {
  const [ads, setAds] = useState<AdCreative[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const pagination = usePagination(ads);

  const load = useCallback(async () => {
    const response = await fetch("/api/portal/ads");
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Failed to load");
      return;
    }
    setAds(data.ads ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/portal/ads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.get("title"),
        type: form.get("type"),
        summary: form.get("summary"),
        mediaSrc: form.get("mediaSrc"),
        mediaUrl: form.get("mediaUrl") || undefined,
        featured: true,
      }),
    });
    const data = await response.json();
    setPending(false);
    if (!response.ok) {
      setError(data.error ?? "Create failed");
      return;
    }
    event.currentTarget.reset();
    await load();
  }

  async function remove(ad: AdCreative) {
    if (!confirm(`Delete ${ad.title}?`)) return;
    await fetch(`/api/portal/ads/${ad.id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Ads</h1>
        <p className="mt-1 text-sm text-[var(--portal-muted)]">
          Publish creative to the marketplace ads board.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[0.95fr_1.25fr]">
        <form onSubmit={onCreate} className="portal-card space-y-3 p-5 sm:p-6">
          <h2 className="text-sm font-semibold">Post ad</h2>
          <input name="title" required placeholder="Title" className="portal-input" />
          <select name="type" className="portal-input appearance-none" defaultValue="photo">
            <option value="photo">Photo</option>
            <option value="visual">Visual</option>
            <option value="video">Video</option>
          </select>
          <input name="summary" required placeholder="Short pitch" className="portal-input" />
          <select name="mediaSrc" className="portal-input appearance-none" defaultValue={LOOKS[0]}>
            {LOOKS.map((src, i) => (
              <option key={src} value={src}>
                Look {i + 1}
              </option>
            ))}
          </select>
          <input
            name="mediaUrl"
            type="url"
            placeholder="Video / link (optional)"
            className="portal-input"
          />
          <button
            type="submit"
            disabled={pending}
            className="portal-btn portal-btn--accent w-full disabled:opacity-60"
          >
            {pending ? "Saving…" : "Publish ad"}
          </button>
          {error ? <p className="text-sm text-[var(--portal-accent)]">{error}</p> : null}
        </form>

        <section className="portal-card overflow-hidden">
          <div className="border-b border-[var(--portal-line)] px-5 py-4">
            <p className="text-sm font-semibold">Creative board</p>
            <p className="text-xs text-[var(--portal-muted)]">{ads.length} live</p>
          </div>
          <ul className="divide-y divide-[var(--portal-line)]">
            {pagination.items.map((ad) => (
              <li key={ad.id} className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
                <div>
                  <span className="portal-badge portal-badge--info capitalize">{ad.type}</span>
                  <p className="mt-2 font-semibold">{ad.title}</p>
                  <p className="mt-1 text-sm text-[var(--portal-muted)]">{ad.summary}</p>
                </div>
                <div className="flex gap-2">
                  <Link href="/ads" className="portal-btn portal-btn--ghost !py-2 !text-xs">
                    Board
                  </Link>
                  <button
                    type="button"
                    onClick={() => void remove(ad)}
                    className="portal-btn portal-btn--ghost !py-2 !text-xs text-[var(--portal-accent)]"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
            {ads.length === 0 ? (
              <li className="px-5 py-10 text-sm text-[var(--portal-muted)]">No ads yet.</li>
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
