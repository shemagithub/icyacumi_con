"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type StatusCheck = {
  id: string;
  label: string;
  ready: boolean;
  detail: string;
};

type SystemStatus = {
  ok: boolean;
  checks: StatusCheck[];
  stats?: {
    pendingPayments: number;
    paidOrdersToday: number;
  };
};

/** Admin clarity card · database, mail, payments, SEO readiness. */
export function AdminSystemStatus() {
  const [data, setData] = useState<SystemStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/admin/system-status", {
          credentials: "include",
        });
        const json = await response.json();
        if (!response.ok) {
          if (!cancelled) setError(json.error ?? "Could not load system status.");
          return;
        }
        if (!cancelled) setData(json as SystemStatus);
      } catch {
        if (!cancelled) setError("Backend unreachable. Start npm run backend.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="portal-card border border-[var(--portal-accent)]/40 px-5 py-4 text-sm text-[var(--portal-accent)]">
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <p className="text-sm text-[var(--portal-muted)]">Checking system status…</p>
    );
  }

  const blocked = data.checks.filter((check) => !check.ready);

  return (
    <section className="portal-card overflow-hidden">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--portal-line)] px-5 py-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.12em] text-[var(--portal-muted)] uppercase">
            System status
          </p>
          <h2 className="mt-1 text-lg font-semibold text-[var(--portal-ink,#111)]">
            {blocked.length === 0
              ? "Marketplace services are ready"
              : `${blocked.length} setup item${blocked.length === 1 ? "" : "s"} need attention`}
          </h2>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-[var(--portal-muted)]">
          <span>
            Paid today:{" "}
            <strong className="text-[var(--portal-ink,#111)]">
              {data.stats?.paidOrdersToday ?? 0}
            </strong>
          </span>
          <span>
            Pending payments:{" "}
            <strong className="text-[var(--portal-ink,#111)]">
              {data.stats?.pendingPayments ?? 0}
            </strong>
          </span>
        </div>
      </div>

      <ul className="divide-y divide-[var(--portal-line)]">
        {data.checks.map((check) => (
          <li
            key={check.id}
            className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="text-sm font-semibold text-[var(--portal-ink,#111)]">
                {check.label}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-[var(--portal-muted)]">
                {check.detail}
              </p>
            </div>
            <span
              className={`mt-1 inline-flex w-fit rounded-full px-2.5 py-1 text-[0.65rem] font-bold tracking-[0.12em] uppercase ${
                check.ready
                  ? "bg-emerald-500/15 text-emerald-700"
                  : "bg-[var(--portal-accent)]/15 text-[var(--portal-accent)]"
              }`}
            >
              {check.ready ? "Ready" : "Action needed"}
            </span>
          </li>
        ))}
      </ul>

      {blocked.some((check) => check.id === "payments") ? (
        <p className="border-t border-[var(--portal-line)] px-5 py-3 text-xs text-[var(--portal-muted)]">
          Checkout stays blocked until XentriPay is configured. Add the key in{" "}
          <code className="text-[var(--portal-ink,#111)]">backend/.env</code>, then restart
          the API.{" "}
          <Link href="/admin/website" className="underline hover:text-[var(--portal-accent)]">
            Website settings
          </Link>
        </p>
      ) : null}
    </section>
  );
}
