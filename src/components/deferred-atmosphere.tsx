"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

/**
 * Lazy decorative weather layer.
 * Must live in a Client Component so `ssr: false` is allowed.
 * Mounts after first paint / idle so pages feel snappier.
 */
const SeasonAtmosphere = dynamic(
  () =>
    import("@/components/season-atmosphere").then(
      (mod) => mod.SeasonAtmosphere,
    ),
  { ssr: false, loading: () => null },
);

export function DeferredAtmosphere() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const enable = () => {
      if (!cancelled) setReady(true);
    };

    const idle = window.requestIdleCallback;
    if (typeof idle === "function") {
      const id = idle(enable, { timeout: 1200 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(id);
      };
    }

    const timer = window.setTimeout(enable, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  if (!ready) return null;
  return <SeasonAtmosphere />;
}
