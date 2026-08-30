"use client";

import Image from "next/image";
import { useSiteSettings } from "@/components/site-settings-provider";

function Wordmark({ name, madeIn, showTagline }: { name: string; madeIn: string; showTagline: boolean }) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const head = parts.length > 1 ? parts.slice(0, -1).join(" ") : "";
  const tail = parts.length > 1 ? parts[parts.length - 1]! : parts[0] ?? name;

  return (
    <span className="block truncate leading-none tracking-[0.03em]">
      {head ? (
        <>
          {head}{" "}
          <span className="font-extrabold tracking-[0.04em] text-rust">{tail}</span>
        </>
      ) : (
        <span className="font-extrabold tracking-[0.04em] text-rust">{tail}</span>
      )}
      {showTagline ? (
        <span className="mt-1 block text-[0.5em] font-semibold tracking-[0.16em] text-bone-dim uppercase">
          {madeIn}
        </span>
      ) : null}
    </span>
  );
}

/**
 * Brand identity lockup · logo + wordmark from live site settings.
 */
export function BrandLogo({
  size = "md",
  className = "",
  priority = false,
  showWordmark = true,
}: {
  size?: "sm" | "md" | "lg" | "hero";
  className?: string;
  priority?: boolean;
  showWordmark?: boolean;
}) {
  const site = useSiteSettings();
  const maskClass = {
    sm: "h-7 w-7",
    md: "h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10",
    lg: "h-10 w-10 sm:h-11 sm:w-11 lg:h-12 lg:w-12",
    hero: "h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16",
  }[size];

  const maskDims = {
    sm: 28,
    md: 40,
    lg: 48,
    hero: 64,
  }[size];

  const wordClass = {
    sm: "text-[0.85rem] sm:text-[0.9rem]",
    md: "text-[0.9rem] min-[380px]:text-[1rem] sm:text-[1.1rem] lg:text-[1.15rem]",
    lg: "text-[1.1rem] sm:text-[1.25rem] lg:text-[1.4rem]",
    hero: "text-[1.25rem] sm:text-[1.6rem] lg:text-[1.9rem]",
  }[size];

  const showTagline = size === "lg" || size === "hero";
  const logoSrc = site.logoUrl || "/brand/logo.png";
  const isDataUrl = logoSrc.startsWith("data:");

  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 sm:gap-2.5 ${className}`}
    >
      {isDataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoSrc}
          alt=""
          width={maskDims}
          height={maskDims}
          className={`${maskClass} craft-frame--soft shrink-0 object-contain`}
          aria-hidden
        />
      ) : (
        <Image
          src={logoSrc}
          alt=""
          width={maskDims}
          height={maskDims}
          priority={priority}
          sizes="(max-width: 640px) 32px, 40px"
          className={`${maskClass} craft-frame--soft shrink-0 object-contain`}
          aria-hidden
        />
      )}
      {showWordmark ? (
        <span className={`font-brand min-w-0 text-coal ${wordClass}`}>
          <Wordmark
            name={site.companyName}
            madeIn={site.madeIn}
            showTagline={showTagline}
          />
        </span>
      ) : null}
    </span>
  );
}
