"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useSiteSettings } from "@/components/site-settings-provider";
import {
  resolveAtmosphere,
  type ResolvedAtmosphere,
} from "@/lib/site-theme";

const SNOW_DAY = 28;
const SNOW_NIGHT = 12;

function SnowLayer({ count }: { count: number }) {
  return (
    <div className="season-atmosphere__snow" aria-hidden>
      {Array.from({ length: count }, (_, index) => (
        <span
          key={index}
          className="season-atmosphere__flake"
          style={{
            left: `${(index * 37) % 100}%`,
            animationDelay: `${(index % 9) * -0.7}s`,
            animationDuration: `${7 + (index % 6)}s`,
            ["--flake-drift" as string]: `${(index % 5) - 2}vw`,
            ["--flake-size" as string]: `${0.22 + (index % 4) * 0.08}rem`,
            opacity: 0.35 + (index % 5) * 0.1,
          }}
        />
      ))}
    </div>
  );
}

/**
 * Seasonal weather wash for the storefront.
 * Summer day → sunlight · winter → snow · nights keep quieter light.
 */
export function SeasonAtmosphere() {
  const pathname = usePathname();
  const { theme } = useSiteSettings();
  const [now, setNow] = useState(() => new Date());
  const storefront =
    !pathname.startsWith("/admin") && !pathname.startsWith("/portal");

  useEffect(() => {
    if (!storefront || theme.atmosphere !== "auto") return;
    const tick = () => setNow(new Date());
    tick();
    const timer = window.setInterval(tick, 60_000);
    return () => window.clearInterval(timer);
  }, [storefront, theme.atmosphere]);

  if (!storefront) return null;

  const mode: ResolvedAtmosphere = resolveAtmosphere(theme.atmosphere, now);
  if (mode === "off") return null;

  const snow =
    mode === "winter-day" ? SNOW_DAY : mode === "winter-night" ? SNOW_NIGHT : 0;

  return (
    <div
      className="season-atmosphere"
      data-mode={mode}
      aria-hidden="true"
    >
      {mode === "summer-day" ? (
        <>
          <div className="season-atmosphere__sun-glow" />
          <div className="season-atmosphere__sun-rays" />
        </>
      ) : null}
      {mode === "summer-night" || mode === "winter-night" ? (
        <div className="season-atmosphere__night-veil" />
      ) : null}
      {snow > 0 ? <SnowLayer count={snow} /> : null}
    </div>
  );
}
