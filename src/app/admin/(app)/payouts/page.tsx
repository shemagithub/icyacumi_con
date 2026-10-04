"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { AdminPagination } from "@/components/admin-pagination";
import { ExportPdfButton } from "@/components/export-pdf-button";
import { formatPrice } from "@/lib/format";
import { usePagination } from "@/lib/pagination";

type BrandPayoutRow = {
  id: string;
  amount: number;
  feeAmount?: number;
  currency: string;
  status: string;
  note: string | null;
  createdAt: string;
  brand: { name: string };
};

type PlatformPayoutRow = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  method: string | null;
  destination: string | null;
  note: string | null;
  createdAt: string;
};

type PlatformSummary = {
  earned: number;
  paidOut: number;
  pending: number;
  available: number;
  productCommission: number;
  ticketCommission: number;
  salesGross: number;
  productCommissionPercent: number;
  ticketCommissionPercent: number;
};

type Tab = "platform" | "brands";

function statusTone(status: string) {
  if (status === "paid") return "ok";
  if (status === "rejected") return "muted";
  return "warn";
}

export default function AdminPayoutsPage() {
  const [tab, setTab] = useState<Tab>("platform");
  const [brandPayouts, setBrandPayouts] = useState<BrandPayoutRow[]>([]);
  const [platformPayouts, setPlatformPayouts] = useState<PlatformPayoutRow[]>([]);
  const [summary, setSummary] = useState<PlatformSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [amount, setAmount] = useState("");

  const brandPagination = usePagination(brandPayouts);
  const platformPagination = usePagination(platformPayouts);

  const loadBrands = useCallback(async () => {
    const response = await fetch("/api/admin/payouts", { credentials: "include" });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Failed to load brand payouts");
      return;
    }
    setBrandPayouts(data.payouts ?? []);
  }, []);

  const loadPlatform = useCallback(async () => {
    const response = await fetch("/api/admin/platform-payouts", {
      credentials: "include",
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Failed to load commission payouts");
      return;
    }
    setSummary(data.summary ?? null);
    setPlatformPayouts(data.payouts ?? data.summary?.payouts ?? []);
  }, []);

  useEffect(() => {
    void loadBrands();
    void loadPlatform();
  }, [loadBrands, loadPlatform]);

  async function setBrandStatus(id: string, status: string) {
    await fetch(`/api/admin/payouts/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await loadBrands();
  }

  async function setPlatformStatus(id: string, status: string) {
    setError(null);
    const response = await fetch(`/api/admin/platform-payouts/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Could not update payout");
      return;
    }
    if (data.summary) setSummary(data.summary);
    await loadPlatform();
  }

  async function withdrawCommission(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/platform-payouts", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(form.get("amount")),
          method: form.get("method"),
          destination: form.get("destination"),
          note: form.get("note"),
          status: form.get("status") || "paid",
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Could not record payout");
        return;
      }
      setSummary(data.summary ?? null);
      setAmount("");
      event.currentTarget.reset();
      setMessage(
        data.payout?.status === "pending"
          ? "Commission payout marked pending."
          : "Commission payout recorded as paid.",
      );
      await loadPlatform();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setPending(false);
    }
  }

  const brandExportRows = useMemo(
    () =>
      brandPayouts.map((payout) => ({
        brand: payout.brand.name,
        amount: payout.amount,
        fee: payout.feeAmount ?? 0,
        status: payout.status,
        note: payout.note ?? "",
        createdAt: new Date(payout.createdAt).toLocaleDateString("en-GB"),
      })),
    [brandPayouts],
  );

  const platformExportRows = useMemo(
    () =>
      platformPayouts.map((payout) => ({
        amount: payout.amount,
        status: payout.status,
        method: payout.method ?? "",
        destination: payout.destination ?? "",
        note: payout.note ?? "",
        createdAt: new Date(payout.createdAt).toLocaleDateString("en-GB"),
      })),
    [platformPayouts],
  );

  const available = summary?.available ?? 0;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payouts</h1>
          <p className="mt-1 text-sm text-[var(--portal-muted)]">
            Withdraw your commission, and approve brand payout requests. Brand
            withdrawals take a flat 350 RWF fee from their earnings.
          </p>
        </div>
        {tab === "brands" ? (
          <ExportPdfButton
            title="Brand payouts"
            columns={[
              { key: "brand", label: "Brand", width: 110 },
              { key: "amount", label: "Send (RWF)", width: 70 },
              { key: "fee", label: "Fee (RWF)", width: 60 },
              { key: "status", label: "Status", width: 70 },
              { key: "note", label: "Note", width: 130 },
              { key: "createdAt", label: "Date", width: 70 },
            ]}
            rows={brandExportRows}
          />
        ) : (
          <ExportPdfButton
            title="Platform commission payouts"
            columns={[
              { key: "amount", label: "Amount (RWF)", width: 80 },
              { key: "status", label: "Status", width: 70 },
              { key: "method", label: "Method", width: 70 },
              { key: "destination", label: "Destination", width: 120 },
              { key: "note", label: "Note", width: 120 },
              { key: "createdAt", label: "Date", width: 80 },
            ]}
            rows={platformExportRows}
          />
        )}
      </header>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["platform", "Your commission"],
            ["brands", "Brand payouts"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setTab(id);
              setError(null);
              setMessage(null);
            }}
            className={`rounded-full px-4 py-2 text-xs font-semibold tracking-[0.12em] uppercase ${
              tab === id
                ? "bg-[var(--portal-accent)] text-white"
                : "bg-[var(--portal-bg)] text-[var(--portal-muted)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

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

      {tab === "platform" ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(
              [
                ["Available to withdraw", available],
                ["Total earned", summary?.earned ?? 0],
                ["Paid out", summary?.paidOut ?? 0],
                ["Pending", summary?.pending ?? 0],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="portal-card p-4">
                <p className="text-xs tracking-[0.12em] text-[var(--portal-muted)] uppercase">
                  {label}
                </p>
                <p className="mt-2 text-xl font-bold tabular-nums">
                  {formatPrice(value)}
                </p>
              </div>
            ))}
          </div>

          <p className="text-xs text-[var(--portal-muted)]">
            Commission from sales at {summary?.productCommissionPercent ?? 10}% products
            {" · "}
            {summary?.ticketCommissionPercent ?? 5}% tickets. Gross tracked sales{" "}
            {formatPrice(summary?.salesGross ?? 0)}.
          </p>

          <form
            onSubmit={withdrawCommission}
            className="portal-card grid gap-4 p-5 sm:grid-cols-2 sm:p-6"
          >
            <div className="sm:col-span-2">
              <h2 className="text-sm font-semibold">Withdraw commission</h2>
              <p className="mt-1 text-xs text-[var(--portal-muted)]">
                Record money you move out of platform commission. Max{" "}
                {formatPrice(available)}. Minimum RWF 100.
              </p>
            </div>
            <label className="block">
              <span className="mb-1.5 block text-xs text-[var(--portal-muted)]">
                Amount (RWF)
              </span>
              <input
                name="amount"
                type="number"
                required
                min={100}
                max={available || undefined}
                step={1}
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className="portal-input"
                placeholder="Amount"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs text-[var(--portal-muted)]">
                Method
              </span>
              <select
                name="method"
                className="portal-input appearance-none"
                defaultValue="mtn"
              >
                <option value="mtn">MTN MoMo</option>
                <option value="airtel">Airtel Money</option>
                <option value="bank">Bank transfer</option>
                <option value="cash">Cash</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs text-[var(--portal-muted)]">
                Destination
              </span>
              <input
                name="destination"
                required
                className="portal-input"
                placeholder="078xxxxxxx or bank account"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs text-[var(--portal-muted)]">
                Status
              </span>
              <select
                name="status"
                className="portal-input appearance-none"
                defaultValue="paid"
              >
                <option value="paid">Paid now</option>
                <option value="pending">Pending transfer</option>
              </select>
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-xs text-[var(--portal-muted)]">
                Note (optional)
              </span>
              <input name="note" className="portal-input" placeholder="Reference / memo" />
            </label>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={pending || available < 100}
                className="portal-btn portal-btn--accent disabled:opacity-60"
              >
                {pending ? "Saving…" : "Withdraw commission"}
              </button>
            </div>
          </form>

          <section className="portal-card overflow-hidden">
            <div className="border-b border-[var(--portal-line)] px-5 py-4">
              <p className="text-sm font-semibold">Commission payout history</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[36rem] text-left text-sm">
                <thead>
                  <tr className="text-xs text-[var(--portal-muted)]">
                    <th className="px-5 py-3 font-medium">Amount</th>
                    <th className="px-3 py-3 font-medium">Method</th>
                    <th className="px-3 py-3 font-medium">Destination</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {platformPagination.items.map((payout) => (
                    <tr
                      key={payout.id}
                      className="border-t border-[var(--portal-line)]"
                    >
                      <td className="px-5 py-3.5">
                        <p className="font-semibold tabular-nums">
                          {formatPrice(payout.amount)}
                        </p>
                        <p className="text-xs text-[var(--portal-muted)]">
                          {new Date(payout.createdAt).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="px-3 py-3.5 capitalize">
                        {payout.method || "-"}
                      </td>
                      <td className="px-3 py-3.5 text-[var(--portal-muted)]">
                        {payout.destination || "-"}
                        {payout.note ? (
                          <span className="mt-0.5 block text-xs">{payout.note}</span>
                        ) : null}
                      </td>
                      <td className="px-3 py-3.5">
                        <span
                          className={`portal-badge portal-badge--${statusTone(payout.status)}`}
                        >
                          {payout.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => void setPlatformStatus(payout.id, "paid")}
                            className="text-xs font-medium text-emerald-700 hover:underline"
                          >
                            Mark paid
                          </button>
                          <button
                            type="button"
                            onClick={() => void setPlatformStatus(payout.id, "rejected")}
                            className="text-xs font-medium text-[var(--portal-accent)] hover:underline"
                          >
                            Reject
                          </button>
                          <button
                            type="button"
                            onClick={() => void setPlatformStatus(payout.id, "pending")}
                            className="text-xs font-medium text-[var(--portal-muted)] hover:underline"
                          >
                            Pending
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {platformPayouts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-5 py-8 text-sm text-[var(--portal-muted)]"
                      >
                        No commission withdrawals yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
            <AdminPagination
              page={platformPagination.page}
              pageSize={platformPagination.pageSize}
              total={platformPagination.total}
              totalPages={platformPagination.totalPages}
              start={platformPagination.start}
              end={platformPagination.end}
              onPageChange={platformPagination.setPage}
              onPageSizeChange={platformPagination.setPageSize}
            />
          </section>
        </>
      ) : (
        <section className="portal-card overflow-hidden">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead>
              <tr className="text-xs text-[var(--portal-muted)]">
                <th className="px-5 py-3 font-medium">Brand</th>
                <th className="px-3 py-3 font-medium">Send to brand</th>
                <th className="px-3 py-3 font-medium">Fee</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {brandPagination.items.map((payout) => (
                <tr
                  key={payout.id}
                  className="border-t border-[var(--portal-line)]"
                >
                  <td className="px-5 py-3.5">
                    <p className="font-medium">{payout.brand.name}</p>
                    <p className="text-xs text-[var(--portal-muted)]">
                      {new Date(payout.createdAt).toLocaleDateString()}
                    </p>
                    {payout.note ? (
                      <p className="mt-1 max-w-xs text-xs text-[var(--portal-muted)]">
                        {payout.note}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-3 py-3.5 font-semibold tabular-nums">
                    {formatPrice(payout.amount)}
                  </td>
                  <td className="px-3 py-3.5 tabular-nums text-[var(--portal-muted)]">
                    {formatPrice(payout.feeAmount ?? 0)}
                  </td>
                  <td className="px-3 py-3.5 capitalize">{payout.status}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void setBrandStatus(payout.id, "paid")}
                        className="text-xs font-medium text-emerald-700 hover:underline"
                      >
                        Mark paid
                      </button>
                      <button
                        type="button"
                        onClick={() => void setBrandStatus(payout.id, "rejected")}
                        className="text-xs font-medium text-[var(--portal-accent)] hover:underline"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => void setBrandStatus(payout.id, "pending")}
                        className="text-xs font-medium text-[var(--portal-muted)] hover:underline"
                      >
                        Pending
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {brandPayouts.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-8 text-sm text-[var(--portal-muted)]"
                  >
                    No brand payout requests yet. Each brand withdrawal takes a flat
                    350 RWF fee from their earnings.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
          <AdminPagination
            page={brandPagination.page}
            pageSize={brandPagination.pageSize}
            total={brandPagination.total}
            totalPages={brandPagination.totalPages}
            start={brandPagination.start}
            end={brandPagination.end}
            onPageChange={brandPagination.setPage}
            onPageSizeChange={brandPagination.setPageSize}
          />
        </section>
      )}
    </div>
  );
}
