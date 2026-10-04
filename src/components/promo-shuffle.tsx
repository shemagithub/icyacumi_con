"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { MediaImage } from "@/components/media-image";
import { Price } from "@/components/price";
import { discountPercent } from "@/lib/format";
import { useSwipeNav } from "@/lib/use-swipe-nav";
import type { Product } from "@/lib/types";

const INTERVAL_MS = 5000;

export function PromoShuffle({ products }: { products: Product[] }) {
  const rootRef = useRef<HTMLElement>(null);
  const resumeTimer = useRef<number | null>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = products.length;

  const goNext = useCallback(() => {
    if (count < 2) return;
    setIndex((current) => (current + 1) % count);
  }, [count]);

  const goPrev = useCallback(() => {
    if (count < 2) return;
    setIndex((current) => (current - 1 + count) % count);
  }, [count]);

  const goTo = useCallback(
    (next: number) => {
      if (count < 2) return;
      setIndex(((next % count) + count) % count);
    },
    [count],
  );

  const pauseAfterSwipe = useCallback(() => {
    setPaused(true);
    if (resumeTimer.current) window.clearTimeout(resumeTimer.current);
    resumeTimer.current = window.setTimeout(() => setPaused(false), 1800);
  }, []);

  const { consumeSwipeClick } = useSwipeNav({
    targetRef: rootRef,
    enabled: count > 1,
    onNext: () => {
      pauseAfterSwipe();
      goNext();
    },
    onPrev: () => {
      pauseAfterSwipe();
      goPrev();
    },
  });

  useEffect(() => {
    return () => {
      if (resumeTimer.current) window.clearTimeout(resumeTimer.current);
    };
  }, []);

  useEffect(() => {
    if (count < 2 || paused) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const timer = window.setInterval(goNext, INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [count, paused, goNext]);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const onClickCapture = (event: MouseEvent) => {
      if (!consumeSwipeClick()) return;
      event.preventDefault();
      event.stopPropagation();
    };
    node.addEventListener("click", onClickCapture, true);
    return () => node.removeEventListener("click", onClickCapture, true);
  }, [consumeSwipeClick]);

  if (!count) return null;

  const current = products[index]!;
  const off = discountPercent(current.price, current.compareAtPrice);
  const brandHref = current.brandSlug
    ? `/brands/${current.brandSlug}?tab=sale`
    : "/shop/sale";

  return (
    <section
      ref={rootRef}
      className="promo-shuffle overflow-hidden border-y-2 border-coal bg-rust text-bone touch-pan-y"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Recent discount promos"
    >
      <div className="grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Link
          href={`/shop/${current.slug}`}
          className="relative aspect-[4/5] min-h-[16rem] overflow-hidden bg-coal sm:aspect-[16/10] lg:aspect-auto lg:min-h-[22rem]"
          draggable={false}
        >
          <MediaImage
            src={current.images[0]?.src ?? "/scenes/hero-dust-season.jpg"}
            alt={current.images[0]?.alt ?? current.name}
            fill
            sizes="(min-width: 1024px) 55vw, 100vw"
            className="pointer-events-none object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-coal/70 via-transparent to-coal/10" />
          {off ? (
            <span className="absolute top-4 left-4 bg-paint-yellow px-3 py-1.5 text-[0.7rem] font-bold tracking-[0.16em] text-coal uppercase">
              −{off}% promo
            </span>
          ) : null}
        </Link>

        <div className="flex flex-col justify-center px-5 py-8 sm:px-8 lg:px-10">
          <p className="text-[0.65rem] font-bold tracking-[0.18em] text-paint-yellow uppercase">
            Recently on promo
          </p>
          <h2 className="font-display mt-2 text-3xl tracking-[0.03em] text-bone sm:text-4xl">
            Sitting stock, cut price
          </h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-bone/75">
            Brands mark down pieces that have been on the floor a while. This strip
            shuffles the latest cuts.
          </p>

          <Link href={`/shop/${current.slug}`} className="mt-6 block max-w-lg">
            <p className="text-[0.65rem] font-bold tracking-[0.16em] text-paint-yellow uppercase">
              {current.brandName ?? "Brand"}
            </p>
            <p className="font-display mt-1 text-2xl tracking-[0.04em]">
              {current.name}
            </p>
            <div className="mt-3">
              <Price
                amount={current.price}
                compareAt={current.compareAtPrice}
                size="lg"
                onDark
              />
            </div>
          </Link>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href="/shop/sale"
              className="craft-btn bg-paint-yellow px-5 py-3 text-[0.65rem] tracking-[0.16em] text-coal uppercase hover:bg-bone"
            >
              All discounted products
            </Link>
            <Link
              href={brandHref}
              className="text-xs tracking-[0.14em] text-bone/80 uppercase underline underline-offset-4 hover:text-paint-yellow"
            >
              {current.brandName ? `${current.brandName} sale tab` : "Brand sale"}
            </Link>
          </div>

          {count > 1 ? (
            <div className="mt-6 flex justify-center gap-1.5 sm:justify-start">
              {products.map((product, i) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => goTo(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index ? "w-6 bg-paint-yellow" : "w-1.5 bg-bone/35"
                  }`}
                  aria-label={`Show ${product.name}`}
                />
              ))}
            </div>
          ) : null}

          {count > 1 ? (
            <ul className="mt-6 hidden gap-2 sm:grid sm:grid-cols-3">
              {products
                .filter((_, i) => i !== index)
                .slice(0, 3)
                .map((product) => (
                  <li key={product.id}>
                    <button
                      type="button"
                      onClick={() =>
                        goTo(products.findIndex((entry) => entry.id === product.id))
                      }
                      className="flex w-full items-center gap-2 rounded-lg border border-bone/20 bg-coal/20 p-1.5 text-left hover:bg-coal/35"
                    >
                      <span className="relative h-12 w-10 shrink-0 overflow-hidden bg-coal">
                        <MediaImage
                          src={product.images[0]?.src ?? "/scenes/hero-dust-season.jpg"}
                          alt=""
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-[0.6rem] tracking-[0.12em] text-paint-yellow uppercase">
                          {product.brandName}
                        </span>
                        <span className="block truncate text-xs text-bone">
                          {product.name}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
            </ul>
          ) : null}
        </div>
      </div>
    </section>
  );
}
