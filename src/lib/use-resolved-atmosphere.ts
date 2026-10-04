"use client";

import { useEffect, useState } from "react";
import { useSiteSettings } from "@/components/site-settings-provider";
import {
  resolveAtmosphere,
  type ResolvedAtmosphere,
} from "@/lib/site-theme";

/** Live resolved atmosphere · refreshes each minute when set to auto. */
export function useResolvedAtmosphere(): ResolvedAtmosphere {
  const { theme } = useSiteSettings();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (theme.atmosphere !== "auto") return;
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, [theme.atmosphere]);

  return resolveAtmosphere(theme.atmosphere, now);
}
