"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Container } from "@/components/container";
import { useSwipeNav } from "@/lib/use-swipe-nav";
import { site } from "@/lib/site";
import type { AdCreative } from "@/lib/types";

const INTERVAL_MS = 6000;

const PURPOSE_CTAS = [
  { href: "/shop", label: "Shop", hint: "Drops & brands" },
  { href: "/events", label: "Tickets", hint: "Nights & floors" },
  { href: "/ads", label: "Ads", hint: "Photo · visual · video" },
] as const;

function HeroChrome({
  featureLabel,
}: {
  featureLabel: string;
}) {
  return (
    <Container className="relative z-[1] w-full pt-12 pb-16 text-center text-bone sm:pt-16 sm:pb-14 md:text-left lg:pb-16">
      <p className="eyebrow text-paint-yellow/90">{site.madeIn}</p>
      <h1 className="font-brand mx-auto mt-3 max-w-3xl text-3xl leading-[0.95] tracking-[0.02em] text-balance text-bone sm:text-5xl md:mx-0 lg:text-6xl">
        BONE <span className="text-paint-yellow">KOBOYI</span>
      </h1>
      <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-bone/85 sm:text-lg md:mx-0">
        {site.tagline} Find what you want fast · no maze.
      </p>
      <p className="mx-auto mt-2 max-w-md text-sm text-bone/65 line-clamp-2 md:mx-0">
        <span className="text-bone/90">{featureLabel}</span>
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2.5 sm:mt-7 sm:gap-3 md:justify-start">
        {PURPOSE_CTAS.map((cta, index) => (
          <Link
            key={cta.href}
            href={cta.href}
            className={
              index === 0
                ? "craft-btn bg-paint-yellow px-4 py-3 text-xs tracking-[0.18em] text-coal uppercase hover:bg-bone sm:px-7 sm:py-3.5"
                : "craft-btn-ghost craft-btn-ghost--paint px-4 py-3 text-xs tracking-[0.18em] text-bone uppercase hover:bg-bone/10 sm:px-7 sm:py-3.5"
            }
          >
            {cta.label}
            <span className="ml-2 hidden font-sans font-normal tracking-[0.08em] text-current/70 normal-case sm:inline">
              {cta.hint}
            </span>
          </Link>
        ))}
      </div>
    </Container>
  );
}

function FallbackHero() {
  return (
    <section className="relative isolate flex min-h-[42vh] items-end overflow-hidden sm:min-h-[48vh] lg:min-h-[52vh]">
      <Image
        src="/editorial/look-01.png"
        alt=""
        fill
        priority
        fetchPriority="high"
        sizes="100vw"
        className="-z-10 object-cover"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-coal via-coal/60 to-coal/20" />
      <HeroChrome featureLabel="Streetwear · makers · nights" />
    </section>
  );
}

export function HeroAdsCarousel({ ads }: { ads: AdCreative[] }) {
  const rootRef = useRef<HTMLElement>(null);
  const resumeTimer = useRef<number | null>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = ads.length;

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
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

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

  if (count === 0) return <FallbackHero />;

  const active = ads[index] ?? ads[0]!;
  const visibleIndexes = new Set(
    count <= 1
      ? [0]
      : [index, (index + 1) % count, (index - 1 + count) % count],
  );

  return (
    <section
      ref={rootRef}
      className="hero-ads relative isolate flex min-h-[42vh] items-end overflow-hidden touch-pan-y sm:min-h-[48vh] lg:min-h-[52vh]"
      aria-roledescription="carousel"
      aria-label="Featured marketplace"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
    >
      {ads.map((ad, slideIndex) => {
        if (!visibleIndexes.has(slideIndex)) return null;
        return (
          <div
            key={ad.id}
            className="absolute inset-0 -z-10 transition-opacity duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
            style={{ opacity: slideIndex === index ? 1 : 0 }}
            aria-hidden={slideIndex !== index}
          >
            <Image
              src={ad.media.src}
              alt=""
              fill
              priority={slideIndex === index}
              fetchPriority={slideIndex === index ? "high" : "low"}
              sizes="100vw"
              className="pointer-events-none object-cover"
              draggable={false}
            />
          </div>
        );
      })}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-coal via-coal/60 to-coal/20" />

      <HeroChrome
        featureLabel={`Now featuring ${active.brand} · ${active.title}`}
      />

      {count > 1 ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex justify-center gap-2 sm:bottom-5">
          {ads.map((ad, dotIndex) => (
            <button
              key={ad.id}
              type="button"
              aria-label={`Show feature ${dotIndex + 1}: ${ad.title}`}
              aria-current={dotIndex === index ? "true" : undefined}
              className={`pointer-events-auto h-2.5 rounded-full transition-all duration-300 ${
                dotIndex === index
                  ? "w-8 bg-paint-yellow"
                  : "w-2.5 bg-bone/45 hover:bg-bone/75"
              }`}
              onClick={() => goTo(dotIndex)}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
