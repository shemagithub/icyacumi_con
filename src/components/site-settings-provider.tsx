"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  defaultSiteSettings,
  normalizeSiteSettings,
  type PublicSiteSettings,
} from "@/lib/site-settings";

const SiteSettingsContext = createContext<PublicSiteSettings>(defaultSiteSettings);

export function SiteSettingsProvider({
  children,
  initial,
}: {
  children: ReactNode;
  initial?: PublicSiteSettings;
}) {
  const [settings, setSettings] = useState<PublicSiteSettings>(
    initial ?? defaultSiteSettings,
  );

  useEffect(() => {
    if (initial) setSettings(initial);
  }, [initial]);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      try {
        const response = await fetch("/api/catalog/site-settings", {
          cache: "no-store",
        });
        if (!response.ok) return;
        const data = (await response.json()) as {
          settings?: Partial<PublicSiteSettings>;
        };
        if (!cancelled) setSettings(normalizeSiteSettings(data.settings));
      } catch {
        /* keep defaults / initial */
      }
    }

    void refresh();
    const onFocus = () => void refresh();
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return (
    <SiteSettingsContext.Provider value={settings}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
