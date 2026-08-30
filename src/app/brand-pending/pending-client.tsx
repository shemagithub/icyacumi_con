"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Container } from "@/components/container";
import { CultureIcon } from "@/components/culture-icons";
import { site } from "@/lib/site";

function PendingContent() {
  const search = useSearchParams();
  const email = search.get("email") ?? "";
  const brand = search.get("brand") ?? "Your brand";
  const status = search.get("status") ?? "pending";
  const rejected = status === "rejected";

  return (
    <Container className="py-16 lg:py-24">
      <div className="craft-panel mx-auto max-w-lg bg-bone/95 p-6 sm:p-8">
        <CultureIcon
          name={rejected ? "spiral" : "drum"}
          className="h-8 w-8 text-rust"
        />
        <p className="eyebrow mt-4">{site.madeIn}</p>
        <h1 className="font-display mt-2 text-4xl tracking-[0.03em]">
          {rejected ? "Application not approved" : "Waiting for approval"}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-bone-dim">
          {rejected ? (
            <>
              <strong className="text-coal">{brand}</strong> was not approved for the
              marketplace portal yet. You can contact us if you need more detail.
            </>
          ) : (
            <>
              <strong className="text-coal">{brand}</strong> is in the review queue.
              After the platform team approves you, log in and start using the portal.
            </>
          )}
        </p>

        <ol className="mt-8 space-y-3 text-sm text-bone-dim">
          <li className="flex gap-2">
            <span className="text-paint-green">✓</span>
            Application submitted
          </li>
          <li className="flex gap-2">
            <span className="text-paint-green">✓</span>
            Email verification
          </li>
          <li className="flex gap-2">
            <span className={rejected ? "text-rust" : "text-rust"}>○</span>
            {rejected ? "Not approved" : "Platform approval"}
          </li>
          <li className="flex gap-2 opacity-60">
            <span>○</span>
            Portal access · list products & manage sales
          </li>
        </ol>

        {email ? (
          <p className="mt-6 text-sm text-bone-dim">
            We will email <strong className="text-coal">{email}</strong> when your
            status changes.
          </p>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={email ? `/login?email=${encodeURIComponent(email)}&next=/portal` : "/login?next=/portal"}
            className="craft-btn bg-rust px-6 py-3 text-xs tracking-[0.16em] text-bone uppercase"
          >
            Try logging in
          </Link>
          <Link
            href="/contact"
            className="craft-btn-ghost px-6 py-3 text-xs tracking-[0.16em] uppercase"
          >
            Contact support
          </Link>
        </div>
      </div>
    </Container>
  );
}

export default function BrandPendingClient() {
  return (
    <Suspense
      fallback={
        <Container className="py-16">
          <p className="text-center text-sm text-bone-dim">Loading…</p>
        </Container>
      }
    >
      <PendingContent />
    </Suspense>
  );
}
