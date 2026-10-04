"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { AdminPagination } from "@/components/admin-pagination";
import { ExportPdfButton } from "@/components/export-pdf-button";
import { kycDocKind } from "@/lib/kyc-docs";
import { usePagination } from "@/lib/pagination";

type BrandRow = {
  id: string;
  name: string;
  slug: string;
  location: string;
  shortBio: string;
  status: string;
  applicationNote: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  rejectedReason: string | null;
  createdAt?: string;
  kycIdReady?: boolean;
  kycRdbReady?: boolean;
  kycSubmittedAt?: string | null;
  _count: { products: number; events: number; ads: number; users: number };
  users: Array<{
    id: string;
    email: string;
    name: string;
    emailVerifiedAt?: string | null;
  }>;
};

type KycPayload = {
  id: string;
  name: string;
  kycSubmittedAt: string | null;
  kycIdDocument: string | null;
  kycRdbCertificate: string | null;
};

function kycComplete(brand: BrandRow) {
  return Boolean(brand.kycIdReady && brand.kycRdbReady);
}

function KycPreview({
  label,
  dataUrl,
}: {
  label: string;
  dataUrl: string | null;
}) {
  const kind = kycDocKind(dataUrl);
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--portal-muted)]">
        {label}
      </p>
      {!dataUrl || !kind ? (
        <p className="text-sm text-[var(--portal-accent)]">Missing</p>
      ) : kind === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={dataUrl}
          alt={label}
          className="max-h-64 w-full rounded-xl border border-[var(--portal-line)] object-contain bg-white"
        />
      ) : (
        <div className="space-y-2">
          <iframe
            title={label}
            src={dataUrl}
            className="h-64 w-full rounded-xl border border-[var(--portal-line)] bg-white"
          />
          <a
            href={dataUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-medium text-[var(--portal-accent)] underline"
          >
            Open PDF in new tab
          </a>
        </div>
      )}
    </div>
  );
}

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<BrandRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">(
    "all",
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [kycView, setKycView] = useState<KycPayload | null>(null);
  const [kycLoadingId, setKycLoadingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (filter === "all") return brands;
    return brands.filter((brand) => brand.status === filter);
  }, [brands, filter]);

  const pagination = usePagination(filtered, 10, filter);

  const load = useCallback(async () => {
    const response = await fetch("/api/admin/brands", { credentials: "include" });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Failed to load brands");
      return;
    }
    setBrands(data.brands ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/brands", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        slug: form.get("slug"),
        shortBio: form.get("shortBio"),
        location: form.get("location"),
        ownerEmail: form.get("ownerEmail"),
        ownerName: form.get("ownerName"),
        ownerPassword: form.get("ownerPassword") || "brand123",
      }),
    });
    const data = await response.json();
    setPending(false);
    if (!response.ok) {
      setError(data.error ?? "Create failed");
      return;
    }
    event.currentTarget.reset();
    setMessage("Brand created and approved.");
    await load();
  }

  async function viewKyc(brand: BrandRow) {
    setKycLoadingId(brand.id);
    setError(null);
    try {
      const response = await fetch(`/api/admin/brands/${brand.id}/kyc`, {
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Could not load KYC documents.");
        return;
      }
      setKycView(data.brand ?? null);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setKycLoadingId(null);
    }
  }

  async function setStatus(
    brand: BrandRow,
    status: "approved" | "rejected" | "pending",
  ) {
    if (status === "approved" && !kycComplete(brand)) {
      setError(
        "Cannot approve yet — national ID and RDB certificate KYC docs are missing.",
      );
      return;
    }
    let rejectedReason: string | null = null;
    if (status === "rejected") {
      rejectedReason =
        window.prompt("Optional note to the brand owner:", brand.rejectedReason ?? "") ??
        null;
    }
    setBusyId(brand.id);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/brands/${brand.id}/status`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, rejectedReason }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Could not update status.");
        return;
      }
      setMessage(
        status === "approved"
          ? `${brand.name} approved · confirmation email sent to the owner.`
          : `${brand.name} marked ${status}.`,
      );
      await load();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(brand: BrandRow) {
    if (!confirm(`Delete brand ${brand.name} and all its content?`)) return;
    await fetch(`/api/admin/brands/${brand.id}`, {
      method: "DELETE",
      credentials: "include",
    });
    await load();
  }

  const pendingCount = brands.filter((brand) => brand.status === "pending").length;

  const exportRows = useMemo(
    () =>
      brands.map((brand) => ({
        name: brand.name,
        slug: brand.slug,
        status: brand.status,
        location: brand.location,
        products: brand._count.products,
        events: brand._count.events,
        ads: brand._count.ads,
        owners: brand.users.map((user) => user.email).join(", "),
      })),
    [brands],
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Brands</h1>
          <p className="mt-1 text-sm text-[var(--portal-muted)]">
            Approve applications, create brands, and manage portal owners.
            {pendingCount > 0
              ? ` ${pendingCount} waiting for approval.`
              : ""}
          </p>
        </div>
        <ExportPdfButton
          title="Brands"
          columns={[
            { key: "name", label: "Name", width: 100 },
            { key: "slug", label: "Slug", width: 80 },
            { key: "status", label: "Status", width: 70 },
            { key: "location", label: "Location", width: 80 },
            { key: "products", label: "Products", width: 50 },
            { key: "owners", label: "Owners", width: 140 },
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

      {kycView ? (
        <div className="portal-card space-y-4 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold">KYC · {kycView.name}</h2>
              <p className="mt-1 text-xs text-[var(--portal-muted)]">
                {kycView.kycSubmittedAt
                  ? `Submitted ${new Date(kycView.kycSubmittedAt).toLocaleString()}`
                  : "No submission timestamp"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setKycView(null)}
              className="portal-btn portal-btn--ghost !py-1.5 !text-xs"
            >
              Close
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <KycPreview label="National ID / passport" dataUrl={kycView.kycIdDocument} />
            <KycPreview label="RDB certificate" dataUrl={kycView.kycRdbCertificate} />
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-1">
        {(
          [
            ["all", "All"],
            ["pending", "Pending"],
            ["approved", "Approved"],
            ["rejected", "Rejected"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`portal-btn !py-1.5 !text-xs ${
              filter === value ? "portal-btn--accent" : "portal-btn--ghost"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.3fr]">
        <form onSubmit={onCreate} className="portal-card space-y-3 p-5">
          <h2 className="text-sm font-semibold">Add approved brand</h2>
          <p className="text-xs text-[var(--portal-muted)]">
            Admin-created brands skip the approval queue.
          </p>
          <input name="name" required placeholder="Brand name" className="portal-input" />
          <input name="slug" required placeholder="slug-name" className="portal-input" />
          <input
            name="location"
            placeholder="Location"
            defaultValue="Kigali, Rwanda"
            className="portal-input"
          />
          <input name="shortBio" placeholder="Short bio" className="portal-input" />
          <input name="ownerName" placeholder="Owner name" className="portal-input" />
          <input
            name="ownerEmail"
            type="email"
            required
            placeholder="owner@email.com"
            className="portal-input"
          />
          <input
            name="ownerPassword"
            type="password"
            placeholder="Password (default brand123)"
            className="portal-input"
          />
          <button
            type="submit"
            disabled={pending}
            className="portal-btn portal-btn--accent w-full disabled:opacity-60"
          >
            {pending ? "Creating…" : "Create brand"}
          </button>
        </form>

        <section className="portal-card overflow-hidden">
          <div className="border-b border-[var(--portal-line)] px-5 py-4">
            <p className="text-sm font-semibold">
              {filtered.length} brand{filtered.length === 1 ? "" : "s"}
            </p>
          </div>
          <ul className="divide-y divide-[var(--portal-line)]">
            {pagination.items.map((brand) => {
              const busy = busyId === brand.id;
              const ready = kycComplete(brand);
              return (
                <li
                  key={brand.id}
                  className="flex flex-wrap items-start justify-between gap-3 px-5 py-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{brand.name}</p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide ${
                          brand.status === "approved"
                            ? "bg-emerald-50 text-emerald-700"
                            : brand.status === "rejected"
                              ? "bg-orange-50 text-[var(--portal-accent)]"
                              : "bg-amber-50 text-amber-800"
                        }`}
                      >
                        {brand.status}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide ${
                          ready
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-orange-50 text-[var(--portal-accent)]"
                        }`}
                      >
                        KYC {ready ? "ready" : "incomplete"}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--portal-muted)]">
                      /{brand.slug} · {brand.location}
                    </p>
                    {brand.applicationNote ? (
                      <p className="mt-2 text-sm text-[var(--portal-muted)]">
                        {brand.applicationNote}
                      </p>
                    ) : null}
                    <p className="mt-2 text-xs text-[var(--portal-muted)]">
                      {brand._count.products} products · {brand._count.events} events ·{" "}
                      {brand._count.ads} ads
                    </p>
                    <p className="mt-1 text-xs text-[var(--portal-muted)]">
                      Owner: {brand.users[0]?.email ?? "-"}
                      {brand.users[0]?.emailVerifiedAt ? " · email verified" : " · email not verified"}
                    </p>
                    {brand.contactPhone || brand.contactEmail ? (
                      <p className="mt-1 text-xs text-[var(--portal-muted)]">
                        Contact: {[brand.contactEmail, brand.contactPhone]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    ) : null}
                    <p className="mt-1 text-xs text-[var(--portal-muted)]">
                      KYC: ID {brand.kycIdReady ? "✓" : "—"} · RDB{" "}
                      {brand.kycRdbReady ? "✓" : "—"}
                      {brand.kycSubmittedAt
                        ? ` · ${new Date(brand.kycSubmittedAt).toLocaleDateString()}`
                        : ""}
                    </p>
                    {!ready && brand.status !== "approved" ? (
                      <p className="mt-1 text-xs text-[var(--portal-accent)]">
                        Approve disabled until both KYC documents are on file.
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={kycLoadingId === brand.id}
                      onClick={() => void viewKyc(brand)}
                      className="portal-btn portal-btn--ghost !py-2 !text-xs disabled:opacity-60"
                    >
                      {kycLoadingId === brand.id ? "Loading…" : "View KYC"}
                    </button>
                    {brand.status !== "approved" ? (
                      <button
                        type="button"
                        disabled={busy || !ready}
                        title={
                          ready
                            ? undefined
                            : "National ID and RDB certificate required before approval"
                        }
                        onClick={() => void setStatus(brand, "approved")}
                        className="portal-btn portal-btn--accent !py-2 !text-xs disabled:opacity-60"
                      >
                        Approve
                      </button>
                    ) : null}
                    {brand.status !== "rejected" ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void setStatus(brand, "rejected")}
                        className="portal-btn portal-btn--ghost !py-2 !text-xs disabled:opacity-60"
                      >
                        Reject
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => void remove(brand)}
                      className="portal-btn portal-btn--ghost !py-2 !text-xs text-[var(--portal-accent)]"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              );
            })}
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
