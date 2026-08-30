"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Container } from "@/components/container";
import { CultureIcon } from "@/components/culture-icons";

export function TrackOrderForm({
  initialReference = "",
}: {
  initialReference?: string;
}) {
  const router = useRouter();
  const [reference, setReference] = useState(initialReference);
  const [email, setEmail] = useState("");

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const ref = reference.trim().toUpperCase();
    if (!ref) return;
    const query = email.trim()
      ? `?email=${encodeURIComponent(email.trim())}`
      : "";
    router.push(`/track/${encodeURIComponent(ref)}${query}`);
  }

  return (
    <Container className="py-12 lg:py-16">
      <header className="max-w-xl">
        <p className="eyebrow">Delivery</p>
        <h1 className="font-display mt-2 text-5xl tracking-[0.03em]">
          Track an order
        </h1>
        <p className="mt-4 text-base leading-relaxed text-bone-dim">
          Enter the order reference from your receipt. Optional email unlocks the
          full address on the timeline.
        </p>
      </header>

      <form
        onSubmit={onSubmit}
        className="craft-panel mt-10 max-w-lg space-y-5 bg-bone/95 p-6 sm:p-8"
      >
        <label className="block">
          <span className="eyebrow mb-2 block">Order reference</span>
          <input
            value={reference}
            onChange={(event) => setReference(event.target.value)}
            required
            className="field-input uppercase"
            placeholder="BK-XXXXXX-XXXX"
            autoComplete="off"
          />
        </label>
        <label className="block">
          <span className="eyebrow mb-2 block">Email (optional)</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="field-input"
            placeholder="you@email.com"
            autoComplete="email"
          />
        </label>
        <button
          type="submit"
          className="craft-btn w-full bg-rust px-6 py-4 text-xs tracking-[0.2em] text-bone uppercase hover:bg-sand"
        >
          Track delivery
        </button>
      </form>

      <p className="mt-8 text-sm text-bone-dim">
        Have an account?{" "}
        <Link href="/account/orders" className="text-rust underline underline-offset-4">
          View your orders
        </Link>
      </p>
      <CultureIcon name="spiral" className="mt-10 h-6 w-6 text-rust/40" />
    </Container>
  );
}
