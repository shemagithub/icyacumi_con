"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SiteFontLoader } from "@/components/site-font-loader";
import { useSiteSettings } from "@/components/site-settings-provider";
import { applyThemeToDocument, resolveAtmosphere } from "@/lib/site-theme";

export function SiteThemeApplier() {
  const pathname = usePathname();
  const { theme } = useSiteSettings();
  const [now, setNow] = useState(() => new Date());
  const storefront = !pathname.startsWith("/admin") && !pathname.startsWith("/portal");

  useEffect(() => {
    if (!storefront || theme.atmosphere !== "auto") return;
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, [storefront, theme.atmosphere]);

  useEffect(() => {
    if (!storefront) {
      applyThemeToDocument(null);
      return () => applyThemeToDocument(null);
    }
    const atmosphere = resolveAtmosphere(theme.atmosphere, now);
    applyThemeToDocument(theme, atmosphere);
    return () => applyThemeToDocument(null);
  }, [storefront, theme, now]);

  if (!storefront) return null;
  return <SiteFontLoader fontIds={[theme.navFont, theme.brandFont]} />;
}
