"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { AdminPagination } from "@/components/admin-pagination";
import { formatPrice } from "@/lib/format";
import { usePagination } from "@/lib/pagination";

interface PaymentsPayload {
  stripeAccountId: string | null;
  payoutProvider: string | null;
  payoutAccount: string | null;
  summary: {
    catalogValue: number;
    shopGross?: number;
    shopEarnings: number;
    ticketGross?: number;
    ticketEarnings: number;
    productCommission?: number;
    ticketCommission?: number;
    platformCommission?: number;
    productCommissionPercent?: number;
    ticketCommissionPercent?: number;
    totalEarned: number;
    paidOut: number;
    pending: number;
    available: number;
    feesPaid?: number;
    withdrawalFee?: number;
    minWithdrawal?: number;
    maxReceivable?: number;
  };
  payouts: Array<{
    id: string;
    amount: number;
    feeAmount?: number;
    status: string;
    note: string | null;
    createdAt: string;
  }>;
}

function statusTone(status: string) {
  const s = status.toLowerCase();
  if (s.includes("paid") || s.includes("complete")) return "ok";
  if (s.includes("pending")) return "warn";
  return "info";
}

export default function PortalPaymentsPage() {
  const [data, setData] = useState<PaymentsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const payouts = useMemo(() => data?.payouts ?? [], [data]);
  const pagination = usePagination(payouts);

  const load = useCallback(async () => {
    const response = await fetch("/api/portal/payments", { credentials: "include" });
    const json = await response.json();
    if (!response.ok) {
      setError(json.error ?? "Failed to load");
      return;
    }
    setData(json);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveDestination(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/portal/payments", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "connect",
        stripeAccountId: form.get("stripeAccountId"),
        payoutProvider: form.get("payoutProvider"),
        payoutAccount: form.get("payoutAccount"),
      }),
    });
    const json = await response.json();
    if (!response.ok) {
      setError(json.error ?? "Could not save destination");
      return;
    }
    setMessage("Payout destination saved.");
    await load();
  }

  async function requestPayout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/portal/payments", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "payout",
        amount: Math.round(Number(form.get("amount"))),
        payoutProvider: form.get("payoutProvider"),
        payoutAccount: form.get("payoutAccount"),
        note: form.get("note"),
        saveDestination: true,
      }),
    });
    const json = await response.json();
    if (!response.ok) {
      setError(json.error ?? "Payout failed");
      return;
    }
    setMessage(
      json.feeAmount
        ? `Payout requested · you receive ${formatPrice(json.youReceive ?? json.payout?.amount ?? 0)}; ${formatPrice(json.feeAmount)} fee taken from earnings.`
        : "Payout requested. Super admin will review and send your money.",
    );
    setAmount("");
    await load();
  }

  if (!data) {
    return (
      <p className="text-sm text-[var(--portal-muted)]">{error ?? "Loading payments…"}</p>
    );
  }

  const available = data.summary.available;
  const withdrawalFee = data.summary.withdrawalFee ?? 350;
  const minWithdrawal = data.summary.minWithdrawal ?? 100;
  const maxReceivable =
    data.summary.maxReceivable ??
    Math.max(0, available >= withdrawalFee + minWithdrawal ? available - withdrawalFee : 0);
  const requestedNet = Math.max(0, Math.round(Number(amount) || 0));
  const previewDebit =
    requestedNet > 0 ? requestedNet + withdrawalFee : withdrawalFee;
  const canWithdraw = maxReceivable >= minWithdrawal;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Earnings & payouts</h1>
          <p className="mt-1 text-sm text-[var(--portal-muted)]">
            Balance from real paid orders (same as Sales). Each withdrawal takes a flat{" "}
            {formatPrice(withdrawalFee)} fee from your earnings · admin reviews each request.
          </p>
        </div>
        <Link href="/portal/sales" className="portal-btn portal-btn--ghost">
          View sales →
        </Link>
      </header>

      {message ? (
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p>
      ) : null}
      {error ? (
        <p className="rounded-2xl bg-orange-50 px-4 py-3 text-sm text-[var(--portal-accent)]">
          {error}
        </p>
      ) : null}

      <section className="portal-card grid gap-6 p-5 sm:grid-cols-[1.2fr_1fr] sm:p-6">
        <div>
          <p className="text-sm text-[var(--portal-muted)]">Available to withdraw</p>
          <p className="mt-2 text-4xl font-bold tracking-tight tabular-nums">
            {formatPrice(available)}
          </p>
          <p className="mt-2 text-sm text-emerald-600">
            Total earned {formatPrice(data.summary.totalEarned)} · Paid{" "}
            {formatPrice(data.summary.paidOut)} · Pending{" "}
            {formatPrice(data.summary.pending)}
          </p>
          <p className="mt-2 text-xs text-[var(--portal-muted)]">
            Withdrawal fee {formatPrice(withdrawalFee)} per request · max you can receive{" "}
            {formatPrice(maxReceivable)}
            {data.summary.feesPaid ? (
              <> · fees so far {formatPrice(data.summary.feesPaid)}</>
            ) : null}
          </p>
          <button
            type="button"
            className="portal-btn portal-btn--ghost mt-4 !py-2 !text-xs"
            onClick={() => setAmount(String(maxReceivable || ""))}
            disabled={!canWithdraw}
          >
            Use max receivable
          </button>
        </div>
          <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-[var(--portal-bg)] p-4">
            <p className="text-xs text-[var(--portal-muted)]">Product sales (you keep)</p>
            <p className="mt-2 text-xl font-bold tabular-nums">
              {formatPrice(data.summary.shopEarnings)}
            </p>
            {data.summary.productCommissionPercent != null ? (
              <p className="mt-1 text-[0.65rem] text-[var(--portal-muted)]">
                Platform {data.summary.productCommissionPercent}% ·{" "}
                {formatPrice(data.summary.productCommission ?? 0)}
              </p>
            ) : null}
          </div>
          <div className="rounded-2xl bg-[var(--portal-bg)] p-4">
            <p className="text-xs text-[var(--portal-muted)]">Ticket sales (you keep)</p>
            <p className="mt-2 text-xl font-bold tabular-nums">
              {formatPrice(data.summary.ticketEarnings)}
            </p>
            {data.summary.ticketCommissionPercent != null ? (
              <p className="mt-1 text-[0.65rem] text-[var(--portal-muted)]">
                Platform {data.summary.ticketCommissionPercent}% ·{" "}
                {formatPrice(data.summary.ticketCommission ?? 0)}
              </p>
            ) : null}
          </div>
          <div className="rounded-2xl bg-[var(--portal-accent)] p-4 text-white col-span-2">
            <p className="text-xs text-white/80">Gross sales (before commission)</p>
            <p className="mt-2 text-xl font-bold tabular-nums">
              {formatPrice(
                (data.summary.shopGross ?? 0) + (data.summary.ticketGross ?? 0),
              )}
            </p>
            <p className="mt-1 text-[0.65rem] text-white/75">
              Matches Sales · catalog list price {formatPrice(data.summary.catalogValue)}
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <form onSubmit={saveDestination} className="portal-card space-y-3 p-5 sm:p-6">
          <h2 className="text-sm font-semibold">Payout destination</h2>
          <p className="text-xs text-[var(--portal-muted)]">
            Or manage this under{" "}
            <Link href="/portal/settings" className="underline hover:text-[var(--portal-accent)]">
              Settings
            </Link>
            .
          </p>
          <select
            name="payoutProvider"
            className="portal-input appearance-none"
            defaultValue={data.payoutProvider ?? "mtn"}
          >
            <option value="mtn">MTN MoMo</option>
            <option value="airtel">Airtel Money</option>
            <option value="bank">Bank transfer</option>
            <option value="stripe">Stripe</option>
          </select>
          <input
            name="payoutAccount"
            className="portal-input"
            placeholder="078xxxxxxx or account #"
            defaultValue={data.payoutAccount ?? ""}
            required
          />
          <input
            name="stripeAccountId"
            className="portal-input"
            placeholder="Stripe acct_… (optional)"
            defaultValue={data.stripeAccountId ?? ""}
          />
          <button type="submit" className="portal-btn portal-btn--ink">
            Save destination
          </button>
        </form>

        <form onSubmit={requestPayout} className="portal-card space-y-3 p-5 sm:p-6">
          <h2 className="text-sm font-semibold">Withdraw earnings</h2>
          <p className="text-xs text-[var(--portal-muted)]">
            Enter how much you want to <strong>receive</strong>. A flat{" "}
            {formatPrice(withdrawalFee)} fee is taken from your available balance.
            Max receive {formatPrice(maxReceivable)} · minimum{" "}
            {formatPrice(minWithdrawal)}.
          </p>
          <input
            name="amount"
            type="number"
            required
            min={minWithdrawal}
            max={maxReceivable || undefined}
            step={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount you receive (RWF)"
            className="portal-input"
          />
          {requestedNet > 0 ? (
            <div className="rounded-2xl bg-[var(--portal-bg)] px-4 py-3 text-xs text-[var(--portal-muted)]">
              <p>
                You receive:{" "}
                <strong className="text-[var(--portal-ink,#111)]">
                  {formatPrice(requestedNet)}
                </strong>
              </p>
              <p className="mt-1">
                Withdrawal fee:{" "}
                <strong className="text-[var(--portal-ink,#111)]">
                  {formatPrice(withdrawalFee)}
                </strong>
              </p>
              <p className="mt-1">
                Taken from earnings:{" "}
                <strong className="text-[var(--portal-ink,#111)]">
                  {formatPrice(previewDebit)}
                </strong>
              </p>
            </div>
          ) : null}
          <select
            name="payoutProvider"
            className="portal-input appearance-none"
            defaultValue={data.payoutProvider ?? "mtn"}
          >
            <option value="mtn">MTN MoMo</option>
            <option value="airtel">Airtel Money</option>
            <option value="bank">Bank transfer</option>
            <option value="stripe">Stripe</option>
          </select>
          <input
            name="payoutAccount"
            className="portal-input"
            placeholder="Phone / account"
            defaultValue={data.payoutAccount ?? ""}
            required
          />
          <input name="note" placeholder="Note (optional)" className="portal-input" />
          <button
            type="submit"
            disabled={!canWithdraw}
            className="portal-btn portal-btn--accent w-full disabled:opacity-60"
          >
            Request payout
          </button>
        </form>
      </div>

      <section className="portal-card overflow-hidden">
        <div className="border-b border-[var(--portal-line)] px-5 py-4">
          <p className="text-sm font-semibold">Payout history</p>
          <p className="text-xs text-[var(--portal-muted)]">Requests for this brand</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[28rem] text-left text-sm">
            <thead>
              <tr className="text-xs text-[var(--portal-muted)]">
                <th className="px-5 py-3 font-medium">You receive</th>
                <th className="px-3 py-3 font-medium">Fee</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 font-medium">Note</th>
                <th className="px-5 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {pagination.items.map((payout) => (
                <tr key={payout.id} className="border-t border-[var(--portal-line)]">
                  <td className="px-5 py-3.5 font-semibold tabular-nums">
                    {formatPrice(payout.amount)}
                  </td>
                  <td className="px-3 py-3.5 tabular-nums text-[var(--portal-muted)]">
                    {formatPrice(payout.feeAmount ?? 0)}
                  </td>
                  <td className="px-3 py-3.5">
                    <span className={`portal-badge portal-badge--${statusTone(payout.status)}`}>
                      {payout.status}
                    </span>
                  </td>
                  <td className="px-3 py-3.5 text-[var(--portal-muted)]">
                    {payout.note || "-"}
                  </td>
                  <td className="px-5 py-3.5 text-[var(--portal-muted)]">
                    {new Date(payout.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {payouts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-sm text-[var(--portal-muted)]">
                    No payouts yet · withdraw when you have available earnings.
                  </td>
                </tr>
              ) : null}
            </tbody>
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
    </div>
  );
}
