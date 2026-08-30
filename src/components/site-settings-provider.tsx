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
    if (initial) {
      setSettings(initial);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/catalog/site-settings", {
          next: { revalidate: 30 },
        } as RequestInit);
        if (!response.ok) return;
        const data = (await response.json()) as {
          settings?: Partial<PublicSiteSettings>;
        };
        if (!cancelled) setSettings(normalizeSiteSettings(data.settings));
      } catch {
        /* keep defaults / initial */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initial]);

  return (
    <SiteSettingsContext.Provider value={settings}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
