"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminPagination } from "@/components/admin-pagination";
import { ExportPdfButton } from "@/components/export-pdf-button";
import { usePagination } from "@/lib/pagination";

type AdRow = {
  id: string;
  title: string;
  type: string;
  summary: string;
  brand: { name: string };
};

export default function AdminAdsPage() {
  const [ads, setAds] = useState<AdRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const pagination = usePagination(ads);

  const load = useCallback(async () => {
    const response = await fetch("/api/admin/ads", { credentials: "include" });
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

  async function remove(ad: AdRow) {
    if (!confirm(`Delete ${ad.title}?`)) return;
    await fetch(`/api/admin/ads/${ad.id}`, {
      method: "DELETE",
      credentials: "include",
    });
    await load();
  }

  const exportRows = useMemo(
    () =>
      ads.map((ad) => ({
        title: ad.title,
        brand: ad.brand.name,
        type: ad.type,
        summary: ad.summary,
      })),
    [ads],
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ads</h1>
          <p className="mt-1 text-sm text-[var(--portal-muted)]">
            All brand creatives on the ads board.
          </p>
        </div>
        <ExportPdfButton
          title="Ads"
          columns={[
            { key: "title", label: "Title", width: 140 },
            { key: "brand", label: "Brand", width: 100 },
            { key: "type", label: "Type", width: 70 },
            { key: "summary", label: "Summary", width: 220 },
          ]}
          rows={exportRows}
        />
      </header>
      {error ? <p className="text-sm text-[var(--portal-accent)]">{error}</p> : null}
      <section className="portal-card overflow-hidden">
        <ul className="divide-y divide-[var(--portal-line)]">
          {pagination.items.map((ad) => (
            <li key={ad.id} className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
              <div>
                <span className="portal-badge portal-badge--info capitalize">{ad.type}</span>
                <p className="mt-2 font-semibold">{ad.title}</p>
                <p className="text-xs text-[var(--portal-muted)]">
                  {ad.brand.name} · {ad.summary}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void remove(ad)}
                className="portal-btn portal-btn--ghost !py-2 !text-xs text-[var(--portal-accent)]"
              >
                Delete
              </button>
            </li>
          ))}
          {ads.length === 0 ? (
            <li className="px-5 py-10 text-sm text-[var(--portal-muted)]">No ads.</li>
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
