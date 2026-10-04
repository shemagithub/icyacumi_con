"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type PaymentsReady = {
  ok: boolean;
  configured: boolean;
  minAmount: number;
  currency: string;
  message: string;
};

/** Clear checkout banner when payments or API are not ready. */
export function PaymentsReadyBanner() {
  const [state, setState] = useState<PaymentsReady | "loading" | "offline">(
    "loading",
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/catalog/payments/ready", {
          cache: "no-store",
        });
        const data = (await response.json().catch(() => ({}))) as PaymentsReady;
        if (!cancelled) {
          setState(
            response.ok
              ? data
              : {
                  ok: false,
                  configured: false,
                  minAmount: 100,
                  currency: "RWF",
                  message:
                    data.message ||
                    "Payment gateway is unavailable right now.",
                },
          );
        }
      } catch {
        if (!cancelled) setState("offline");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state === "loading") return null;

  if (state === "offline") {
    return (
      <div
        role="status"
        className="mb-6 border border-rust/40 bg-rust/5 px-4 py-3 text-sm text-coal"
      >
        <p className="font-semibold tracking-[0.04em]">API offline</p>
        <p className="mt-1 text-bone-dim">
          Start the backend (`npm run backend`) so checkout can reach XentriPay and
          create orders.
        </p>
      </div>
    );
  }

  if (state.configured) {
    return (
      <div
        role="status"
        className="mb-6 border border-coal/10 bg-ash/40 px-4 py-3 text-sm text-bone-dim"
      >
        Live checkout via XentriPay · MTN MoMo, Airtel Money, and card · amounts in{" "}
        {state.currency} (min {state.minAmount.toLocaleString()}).
      </div>
    );
  }

  return (
    <div
      role="alert"
      className="mb-6 border border-rust/50 bg-rust/5 px-4 py-3 text-sm text-coal"
    >
      <p className="font-semibold tracking-[0.04em]">Payments not connected</p>
      <p className="mt-1 text-bone-dim">{state.message}</p>
      <p className="mt-2 text-xs text-bone-dim">
        Admins: add <code>XENTRIPAY_API_KEY</code> in{" "}
        <code>backend/.env</code>, restart the API, then retry.{" "}
        <Link href="/contact" className="underline hover:text-rust">
          Contact support
        </Link>
      </p>
    </div>
  );
}
