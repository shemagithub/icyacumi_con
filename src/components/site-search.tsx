"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { CultureIcon } from "@/components/culture-icons";
import { formatPrice } from "@/lib/format";
import type { AdCreative, MarketEvent, Product, Vendor } from "@/lib/types";

type SearchResponse = {
  query: string;
  products: Product[];
  brands: Vendor[];
  events: MarketEvent[];
  ads: AdCreative[];
};

type SearchFilter = "all" | "products" | "brands" | "events" | "ads";

const FILTERS: { id: SearchFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "products", label: "Products" },
  { id: "brands", label: "Brands" },
  { id: "events", label: "Events" },
  { id: "ads", label: "Ads" },
];

const EMPTY: SearchResponse = {
  query: "",
  products: [],
  brands: [],
  events: [],
  ads: [],
};

function countForFilter(data: SearchResponse, filter: SearchFilter) {
  if (filter === "products") return data.products.length;
  if (filter === "brands") return data.brands.length;
  if (filter === "events") return data.events.length;
  if (filter === "ads") return data.ads.length;
  return (
    data.products.length +
    data.brands.length +
    data.events.length +
    data.ads.length
  );
}

export function SiteSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<SearchFilter>("all");
  const [results, setResults] = useState<SearchResponse>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogId = useId();
  const requestId = useRef(0);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setFilter("all");
    setResults(EMPTY);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => {
      document.body.style.overflow = "";
      window.clearTimeout(t);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < 1) {
      setResults(EMPTY);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    const id = ++requestId.current;
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(q)}`,
          { cache: "no-store" },
        );
        const data = (await response.json()) as SearchResponse & { error?: string };
        if (id !== requestId.current) return;
        if (!response.ok) {
          setError(data.error ?? "Search failed.");
          setResults(EMPTY);
          return;
        }
        setResults(data);
      } catch {
        if (id !== requestId.current) return;
        setError("Could not reach search. Is the backend running?");
        setResults(EMPTY);
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    }, 180);

    return () => window.clearTimeout(timer);
  }, [query, open]);

  const hasQuery = query.trim().length > 0;
  const hits = countForFilter(results, filter);
  const showProducts = filter === "all" || filter === "products";
  const showBrands = filter === "all" || filter === "brands";
  const showEvents = filter === "all" || filter === "events";
  const showAds = filter === "all" || filter === "ads";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 text-coal transition-colors hover:text-rust xl:gap-2"
        aria-label="Search"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <CultureIcon
          name="search"
          className="h-7 w-7 text-rust transition-colors group-hover:text-indigo lg:h-5 lg:w-5 xl:h-6 xl:w-6"
        />
        <span className="hidden font-sans text-[0.65rem] font-bold tracking-[0.16em] uppercase lg:inline">
          Search
        </span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-[200]" role="presentation">
          <button
            type="button"
            className="absolute inset-0 cursor-default bg-coal/60 backdrop-blur-[3px]"
            aria-label="Close search"
            onClick={close}
          />

          <div
            id={dialogId}
            role="dialog"
            aria-modal="true"
            aria-label="Search marketplace"
            className="absolute top-[12vh] right-3 left-3 z-[210] mx-auto w-auto max-w-2xl sm:top-[14vh] sm:right-auto sm:left-1/2 sm:w-[min(42rem,calc(100vw-2rem))] sm:-translate-x-1/2"
          >
            <div className="overflow-hidden rounded-2xl border border-ash-line bg-bone shadow-[0_24px_60px_rgba(17,17,17,0.28)]">
              <div className="flex items-center gap-2 border-b border-ash-line px-3 py-3 sm:px-4">
                <CultureIcon name="search" className="h-5 w-5 shrink-0 text-rust" />
                <input
                  ref={inputRef}
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search products, brands, events, ads…"
                  className="min-w-0 flex-1 bg-transparent text-base text-coal outline-none placeholder:text-bone-dim"
                  autoComplete="off"
                  spellCheck={false}
                  aria-autocomplete="list"
                  aria-controls={`${dialogId}-results`}
                />
                {query ? (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      inputRef.current?.focus();
                    }}
                    className="rounded-md px-2 py-1 text-[0.65rem] font-bold tracking-[0.14em] text-bone-dim uppercase hover:bg-ash/60 hover:text-coal"
                  >
                    Clear
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={close}
                  className="inline-flex items-center gap-1 rounded-md bg-ash/50 px-2.5 py-1.5 text-coal hover:bg-ash"
                  aria-label="Close search"
                >
                  <CultureIcon name="menuClose" className="h-4 w-4 text-rust" />
                  <span className="text-[0.6rem] font-bold tracking-[0.14em] uppercase">
                    Esc
                  </span>
                </button>
              </div>

              <div
                className="flex gap-1.5 overflow-x-auto border-b border-ash-line px-3 py-2 sm:px-4"
                role="tablist"
                aria-label="Search filters"
              >
                {FILTERS.map((item) => {
                  const active = filter === item.id;
                  const count =
                    hasQuery && !loading
                      ? countForFilter(results, item.id)
                      : null;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setFilter(item.id)}
                      className={`shrink-0 rounded-full px-3 py-1.5 text-[0.65rem] font-bold tracking-[0.14em] uppercase transition-colors ${
                        active
                          ? "bg-rust text-bone"
                          : "bg-ash/50 text-bone-dim hover:bg-ash hover:text-coal"
                      }`}
                    >
                      {item.label}
                      {count !== null ? (
                        <span className="ml-1 tabular-nums opacity-80">
                          {count}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>

              <div
                id={`${dialogId}-results`}
                className="max-h-[min(62vh,28rem)] overflow-y-auto overscroll-contain"
              >
                {!hasQuery ? (
                  <div className="px-5 py-8 text-sm text-bone-dim">
                    <p className="font-medium text-coal">Quick find</p>
                    <p className="mt-2 leading-relaxed">
                      Products show first. Use the filters above when you only
                      want brands, events, or ads.
                    </p>
                    <ul className="mt-4 flex flex-wrap gap-2 text-[0.65rem] font-bold tracking-[0.14em] uppercase">
                      {["hoodie", "kigali", "dust", "ticket", "rodeo"].map((hint) => (
                        <li key={hint}>
                          <button
                            type="button"
                            onClick={() => setQuery(hint)}
                            className="rounded-full border border-ash-line bg-ash/40 px-3 py-1.5 hover:border-rust hover:text-rust"
                          >
                            {hint}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : loading ? (
                  <p className="px-5 py-8 text-sm text-bone-dim">Searching…</p>
                ) : error ? (
                  <p className="px-5 py-8 text-sm text-rust" role="alert">
                    {error}
                  </p>
                ) : hits === 0 ? (
                  <p className="px-5 py-8 text-sm text-bone-dim">
                    No {filter === "all" ? "matches" : filter} for “
                    {query.trim()}”. Try another word or filter.
                  </p>
                ) : (
                  <div className="divide-y divide-ash-line">
                    {/* Products first on All; other filters show only their type */}
                    {showProducts && results.products.length > 0 ? (
                      <ResultSection title="Products">
                        {results.products.map((product) => {
                          const image = product.images[0];
                          return (
                            <ResultLink
                              key={product.id}
                              href={`/shop/${product.slug}`}
                              onNavigate={close}
                              eyebrow={product.brandName ?? "Product"}
                              title={product.name}
                              detail={`${product.tagline} · ${product.inStock ? "In stock" : "Sold out"} · ${formatPrice(product.price)}`}
                              image={image}
                            />
                          );
                        })}
                      </ResultSection>
                    ) : null}

                    {showBrands && results.brands.length > 0 ? (
                      <ResultSection title="Brands">
                        {results.brands.map((brand) => (
                          <ResultLink
                            key={brand.id}
                            href={`/brands/${brand.slug}`}
                            onNavigate={close}
                            eyebrow="Brand"
                            title={brand.name}
                            detail={`${brand.location} · ${brand.shortBio}`}
                            icon="necklace"
                          />
                        ))}
                      </ResultSection>
                    ) : null}

                    {showEvents && results.events.length > 0 ? (
                      <ResultSection title="Events">
                        {results.events.map((event) => (
                          <ResultLink
                            key={event.id}
                            href={`/events/${event.slug}`}
                            onNavigate={close}
                            eyebrow="Event"
                            title={event.title}
                            detail={`${event.date} · ${event.venue}, ${event.city} · from ${formatPrice(event.price)} · ${event.ticketsLeft > 0 ? `${event.ticketsLeft} left` : "Sold out"}`}
                            image={event.image}
                            icon="drum"
                          />
                        ))}
                      </ResultSection>
                    ) : null}

                    {showAds && results.ads.length > 0 ? (
                      <ResultSection title="Ads">
                        {results.ads.map((ad) => (
                          <ResultLink
                            key={ad.id}
                            href="/ads"
                            onNavigate={close}
                            eyebrow={ad.type}
                            title={ad.title}
                            detail={`${ad.brand} · ${ad.summary}`}
                            image={ad.media}
                            icon="mask"
                          />
                        ))}
                      </ResultSection>
                    ) : null}
                  </div>
                )}
              </div>

              {hasQuery && hits > 0 ? (
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-ash-line bg-ash/30 px-4 py-2.5 text-[0.65rem] tracking-[0.12em] text-bone-dim uppercase">
                  <span>{hits} result{hits === 1 ? "" : "s"}</span>
                  <Link
                    href={`/search?q=${encodeURIComponent(query.trim())}`}
                    onClick={close}
                    className="font-bold text-coal underline-offset-2 hover:text-rust hover:underline"
                  >
                    View all results
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function ResultSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="px-2 py-2 sm:px-3">
      <p className="px-2 pt-2 pb-1 text-[0.65rem] font-bold tracking-[0.16em] text-bone-dim uppercase">
        {title}
      </p>
      <ul>{children}</ul>
    </section>
  );
}

function ResultLink({
  href,
  onNavigate,
  eyebrow,
  title,
  detail,
  image,
  icon,
}: {
  href: string;
  onNavigate: () => void;
  eyebrow: string;
  title: string;
  detail: string;
  image?: { src: string; alt: string };
  icon?: "necklace" | "drum" | "mask";
}) {
  return (
    <li>
      <Link
        href={href}
        onClick={onNavigate}
        className="flex gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-ash/55"
      >
        <div className="relative h-14 w-12 shrink-0 overflow-hidden rounded-md bg-ash">
          {image ? (
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="48px"
              className="object-cover"
            />
          ) : icon ? (
            <div className="flex h-full items-center justify-center">
              <CultureIcon name={icon} className="h-6 w-6 text-rust" />
            </div>
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[0.65rem] font-bold tracking-[0.14em] text-rust uppercase">
            {eyebrow}
          </p>
          <p className="mt-0.5 truncate font-semibold text-coal">{title}</p>
          <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-bone-dim">
            {detail}
          </p>
        </div>
      </Link>
    </li>
  );
}
