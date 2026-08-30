"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

/** Fires once per session id to email receipt + persist order; surfaces tracking ref. */
export function SendOrderReceipt({ sessionId }: { sessionId?: string }) {
  const [reference, setReference] = useState<string | null>(null);
  const sent = useRef(false);

  useEffect(() => {
    if (!sessionId || sent.current) return;
    sent.current = true;
    void fetch("/api/checkout/receipt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    })
      .then(async (response) => {
        if (!response.ok) return;
        const data = (await response.json()) as { reference?: string | null };
        if (data.reference) setReference(data.reference);
      })
      .catch(() => {
        // Non-blocking · success page still works if mail fails.
      });
  }, [sessionId]);

  if (!reference) return null;

  return (
    <p className="mt-6 text-sm text-bone-dim">
      Track delivery:{" "}
      <Link
        href={`/track/${encodeURIComponent(reference)}`}
        className="font-semibold text-rust underline underline-offset-4"
      >
        {reference}
      </Link>
    </p>
  );
}
