"use client";

import { useEffect, useState } from "react";
import { Container } from "@/components/container";
import { site } from "@/lib/site";

type LegalPage = {
  id: string;
  title: string;
  body: string;
  updatedAt: string;
};

export function LegalDocument({ id }: { id: "terms" | "privacy" }) {
  const [page, setPage] = useState<LegalPage | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch(`/api/catalog/legal/${id}`, {
          cache: "no-store",
        });
        const data = await response.json();
        if (!response.ok) {
          if (!cancelled) setError(data.error ?? "Could not load page.");
          return;
        }
        if (!cancelled) setPage(data.page as LegalPage);
      } catch {
        if (!cancelled) setError("Could not reach the server.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error) {
    return (
      <Container className="py-16">
        <p className="text-sm text-rust">{error}</p>
      </Container>
    );
  }

  if (!page) {
    return (
      <Container className="py-16">
        <p className="text-sm text-bone-dim">Loading…</p>
      </Container>
    );
  }

  const paragraphs = page.body
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <Container className="py-12 lg:py-16">
      <p className="eyebrow">{site.madeIn}</p>
      <h1 className="font-display mt-2 text-5xl tracking-[0.03em]">
        {page.title}
      </h1>
      <p className="mt-3 text-xs text-bone-dim">
        Last updated{" "}
        {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
          new Date(page.updatedAt),
        )}
      </p>
      <div className="craft-panel mt-10 max-w-3xl space-y-5 bg-bone/95 p-6 sm:p-8">
        {paragraphs.map((block) => (
          <p
            key={block.slice(0, 48)}
            className="whitespace-pre-wrap text-sm leading-relaxed text-coal"
          >
            {block}
          </p>
        ))}
      </div>
    </Container>
  );
}
