"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { AdminPagination } from "@/components/admin-pagination";
import { useAuth } from "@/components/auth-provider";
import { ExportPdfButton } from "@/components/export-pdf-button";
import { formatPrice } from "@/lib/format";
import { usePagination } from "@/lib/pagination";

type Settings = {
  productCommissionPercent: number;
  ticketCommissionPercent: number;
};

type BrandCommissionRow = {
  brandId: string;
  brandName: string;
  brandSlug: string;
  orderCount: number;
  productUnits: number;
  ticketUnits: number;
  productSales: number;
  ticketSales: number;
  salesGross: number;
  productCommission: number;
  ticketCommission: number;
  platformCommission: number;
  brandKeeps: number;
};

type CommissionReport = {
  settings: Settings;
  sellingBrands: BrandCommissionRow[];
  brands: BrandCommissionRow[];
  totals: {
    salesGross: number;
    productSales: number;
    ticketSales: number;
    platformCommission: number;
    productCommission: number;
    ticketCommission: number;
    brandKeeps: number;
    orderCount: number;
  };
};

export default function AdminSettingsPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [report, setReport] = useState<CommissionReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [passwordPending, setPasswordPending] = useState(false);

  const load = useCallback(async () => {
    const [settingsRes, reportRes] = await Promise.all([
      fetch("/api/admin/settings", { credentials: "include" }),
      fetch("/api/admin/commission", { credentials: "include" }),
    ]);
    const settingsData = await settingsRes.json();
    const reportData = await reportRes.json();
    if (!settingsRes.ok) {
      setError(settingsData.error ?? "Failed to load settings");
      return;
    }
    setSettings(settingsData.settings);
    if (reportRes.ok) {
      setReport(reportData as CommissionReport);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const sellingRows = useMemo(
    () => report?.sellingBrands ?? [],
    [report],
  );
  const pagination = usePagination(sellingRows);

  const exportRows = useMemo(() => {
    const rows = report?.sellingBrands?.length
      ? report.sellingBrands
      : report?.brands ?? [];
    return rows.map((row) => ({
      brand: row.brandName,
      orders: row.orderCount,
      productSales: row.productSales,
      ticketSales: row.ticketSales,
      salesGross: row.salesGross,
      platformCommission: row.platformCommission,
      brandKeeps: row.brandKeeps,
    }));
  }, [report]);

  async function onSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/settings", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productCommissionPercent: Number(form.get("productCommissionPercent")),
        ticketCommissionPercent: Number(form.get("ticketCommissionPercent")),
      }),
    });
    const data = await response.json();
    setPending(false);
    if (!response.ok) {
      setError(data.error ?? "Could not save");
      return;
    }
    setSettings(data.settings);
    setMessage("Commission rates updated for all brands.");
    await load();
  }

  async function onChangePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordPending(true);
    setPasswordError(null);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const nextPassword = String(form.get("nextPassword") ?? "");
    const confirm = String(form.get("confirm") ?? "");
    if (nextPassword !== confirm) {
      setPasswordError("New passwords do not match.");
      setPasswordPending(false);
      return;
    }
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: form.get("currentPassword"),
          nextPassword,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setPasswordError(data.error ?? "Could not update password.");
        return;
      }
      await logout();
      router.push(data.redirectTo ?? "/login?changed=1");
      router.refresh();
    } catch {
      setPasswordError("Could not reach the server.");
    } finally {
      setPasswordPending(false);
    }
  }

  if (!settings) {
    return (
      <p className="text-sm text-[var(--portal-muted)]">{error ?? "Loading settings…"}</p>
    );
  }

  const productKeep = 100 - settings.productCommissionPercent;
  const ticketKeep = 100 - settings.ticketCommissionPercent;
  const selling = sellingRows;
  const totals = report?.totals;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Commission
          </h1>
          <p className="mt-1 text-sm text-[var(--portal-muted)]">
            Set rates, then see which brands are selling and how much commission
            the platform earns from real orders.
          </p>
        </div>
        <ExportPdfButton
          title="Brand commission report"
          subtitle={`Product ${settings.productCommissionPercent}% · Ticket ${settings.ticketCommissionPercent}%`}
          columns={[
            { key: "brand", label: "Brand", width: 120 },
            { key: "orders", label: "Orders", width: 50 },
            { key: "productSales", label: "Product sales (RWF)", width: 90 },
            { key: "ticketSales", label: "Ticket sales (RWF)", width: 90 },
            { key: "salesGross", label: "Gross sales (RWF)", width: 90 },
            { key: "platformCommission", label: "Your commission (RWF)", width: 100 },
            { key: "brandKeeps", label: "Brand keeps (RWF)", width: 90 },
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

      {totals ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="portal-card p-4">
            <p className="text-xs text-[var(--portal-muted)]">Gross brand sales</p>
            <p className="mt-1 text-xl font-bold tabular-nums">
              {formatPrice(totals.salesGross)}
            </p>
          </div>
          <div className="portal-card p-4">
            <p className="text-xs text-[var(--portal-muted)]">Your commission</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-[var(--portal-accent)]">
              {formatPrice(totals.platformCommission)}
            </p>
            <Link
              href="/admin/payouts"
              className="mt-2 inline-block text-xs font-semibold tracking-[0.12em] text-[var(--portal-accent)] uppercase underline"
            >
              Withdraw commission
            </Link>
          </div>
          <div className="portal-card p-4">
            <p className="text-xs text-[var(--portal-muted)]">Brands keep</p>
            <p className="mt-1 text-xl font-bold tabular-nums">
              {formatPrice(totals.brandKeeps)}
            </p>
          </div>
          <div className="portal-card p-4">
            <p className="text-xs text-[var(--portal-muted)]">Brands with sales</p>
            <p className="mt-1 text-xl font-bold tabular-nums">{selling.length}</p>
          </div>
        </div>
      ) : null}

      <section className="portal-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--portal-line)] px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold">Brand sales & commission</h2>
            <p className="mt-1 text-xs text-[var(--portal-muted)]">
              From paid (non-cancelled) orders. Product cut{" "}
              {settings.productCommissionPercent}% · ticket cut{" "}
              {settings.ticketCommissionPercent}%.
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[var(--portal-bg)] text-xs tracking-[0.08em] text-[var(--portal-muted)] uppercase">
              <tr>
                <th className="px-5 py-3 font-semibold">Brand</th>
                <th className="px-3 py-3 font-semibold">Orders</th>
                <th className="px-3 py-3 font-semibold">Product sales</th>
                <th className="px-3 py-3 font-semibold">Ticket sales</th>
                <th className="px-3 py-3 font-semibold">Gross</th>
                <th className="px-3 py-3 font-semibold">Your commission</th>
                <th className="px-5 py-3 font-semibold">Brand keeps</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--portal-line)]">
              {pagination.items.map((row) => (
                <tr key={row.brandId}>
                  <td className="px-5 py-3 font-medium">{row.brandName}</td>
                  <td className="px-3 py-3 tabular-nums">{row.orderCount}</td>
                  <td className="px-3 py-3 tabular-nums">
                    {formatPrice(row.productSales)}
                  </td>
                  <td className="px-3 py-3 tabular-nums">
                    {formatPrice(row.ticketSales)}
                  </td>
                  <td className="px-3 py-3 tabular-nums font-medium">
                    {formatPrice(row.salesGross)}
                  </td>
                  <td className="px-3 py-3 tabular-nums text-[var(--portal-accent)]">
                    {formatPrice(row.platformCommission)}
                  </td>
                  <td className="px-5 py-3 tabular-nums">
                    {formatPrice(row.brandKeeps)}
                  </td>
                </tr>
              ))}
              {selling.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-10 text-sm text-[var(--portal-muted)]"
                  >
                    No brand sales yet. When orders complete, each brand’s sales
                    and your commission appear here.
                  </td>
                </tr>
              ) : null}
            </tbody>
            {totals && selling.length > 0 ? (
              <tfoot className="border-t border-[var(--portal-line)] bg-[var(--portal-bg)] text-sm font-semibold">
                <tr>
                  <td className="px-5 py-3">Total</td>
                  <td className="px-3 py-3 tabular-nums">{totals.orderCount}</td>
                  <td className="px-3 py-3 tabular-nums">
                    {formatPrice(totals.productSales)}
                  </td>
                  <td className="px-3 py-3 tabular-nums">
                    {formatPrice(totals.ticketSales)}
                  </td>
                  <td className="px-3 py-3 tabular-nums">
                    {formatPrice(totals.salesGross)}
                  </td>
                  <td className="px-3 py-3 tabular-nums text-[var(--portal-accent)]">
                    {formatPrice(totals.platformCommission)}
                  </td>
                  <td className="px-5 py-3 tabular-nums">
                    {formatPrice(totals.brandKeeps)}
                  </td>
                </tr>
              </tfoot>
            ) : null}
          </table>
        </div>
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

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <form onSubmit={onSave} className="portal-card space-y-5 p-5 sm:p-6">
          <div>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold">
                Product sale commission
              </span>
              <span className="mb-2 block text-xs text-[var(--portal-muted)]">
                Platform cut when a brand sells a product (0-100%).
              </span>
              <div className="flex items-center gap-3">
                <input
                  name="productCommissionPercent"
                  type="number"
                  required
                  min={0}
                  max={100}
                  step={1}
                  defaultValue={settings.productCommissionPercent}
                  className="portal-input max-w-[8rem]"
                />
                <span className="text-sm font-semibold">%</span>
              </div>
            </label>
          </div>

          <div>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold">
                Ticket sale commission
              </span>
              <span className="mb-2 block text-xs text-[var(--portal-muted)]">
                Platform cut on event ticket sales (0-100%).
              </span>
              <div className="flex items-center gap-3">
                <input
                  name="ticketCommissionPercent"
                  type="number"
                  required
                  min={0}
                  max={100}
                  step={1}
                  defaultValue={settings.ticketCommissionPercent}
                  className="portal-input max-w-[8rem]"
                />
                <span className="text-sm font-semibold">%</span>
              </div>
            </label>
          </div>

          <button
            type="submit"
            disabled={pending}
            className="portal-btn portal-btn--accent disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save commission rates"}
          </button>
        </form>

        <section className="portal-card space-y-4 p-5 sm:p-6">
          <h2 className="text-sm font-semibold">How it applies</h2>
          <div className="rounded-2xl bg-[var(--portal-bg)] p-4">
            <p className="text-xs text-[var(--portal-muted)]">On each product sale</p>
            <p className="mt-2 text-2xl font-bold">
              {settings.productCommissionPercent}% platform
            </p>
            <p className="mt-1 text-sm text-[var(--portal-muted)]">
              Brand keeps <strong>{productKeep}%</strong>
            </p>
          </div>
          <div className="rounded-2xl bg-[var(--portal-bg)] p-4">
            <p className="text-xs text-[var(--portal-muted)]">On each ticket sale</p>
            <p className="mt-2 text-2xl font-bold">
              {settings.ticketCommissionPercent}% platform
            </p>
            <p className="mt-1 text-sm text-[var(--portal-muted)]">
              Brand keeps <strong>{ticketKeep}%</strong>
            </p>
          </div>
        </section>
      </div>

      <section className="portal-card max-w-lg space-y-3 p-5 sm:p-6">
        <h2 className="text-sm font-semibold">Change password</h2>
        <p className="text-xs text-[var(--portal-muted)]">
          You’ll be signed out after updating. Forgot it?{" "}
          <Link href="/forgot-password" className="underline">
            Reset by email
          </Link>
          .
        </p>
        <form onSubmit={onChangePassword} className="space-y-3">
          <label className="block">
            <span className="mb-1.5 block text-xs text-[var(--portal-muted)]">
              Current password
            </span>
            <input
              name="currentPassword"
              type="password"
              required
              autoComplete="current-password"
              className="portal-input"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs text-[var(--portal-muted)]">
              New password
            </span>
            <input
              name="nextPassword"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              className="portal-input"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs text-[var(--portal-muted)]">
              Confirm new password
            </span>
            <input
              name="confirm"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              className="portal-input"
            />
          </label>
          {passwordError ? (
            <p className="rounded-2xl bg-orange-50 px-4 py-3 text-sm text-[var(--portal-accent)]">
              {passwordError}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={passwordPending}
            className="portal-btn portal-btn--ghost disabled:opacity-60"
          >
            {passwordPending ? "Updating…" : "Update password"}
          </button>
        </form>
      </section>
    </div>
  );
}
