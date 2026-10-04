"use client";

import { useEffect } from "react";
import { googleFontsHrefs } from "@/lib/site-fonts";

const LINK_PREFIX = "store-google-fonts-";

function ensurePreconnect(id: string, href: string, crossOrigin = false) {
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "preconnect";
  link.href = href;
  if (crossOrigin) link.crossOrigin = "anonymous";
  document.head.appendChild(link);
}

export function SiteFontLoader({ fontIds }: { fontIds: string[] }) {
  const fontKey = fontIds.join("|");

  useEffect(() => {
    const ids = fontKey ? fontKey.split("|") : [];
    ensurePreconnect("store-fonts-preconnect-g", "https://fonts.googleapis.com");
    ensurePreconnect("store-fonts-preconnect-s", "https://fonts.gstatic.com", true);

    const hrefs = googleFontsHrefs(ids);
    const keep = new Set(hrefs.map((_, index) => `${LINK_PREFIX}${index}`));

    document
      .querySelectorAll<HTMLLinkElement>(`link[id^="${LINK_PREFIX}"]`)
      .forEach((node) => {
        if (!keep.has(node.id)) node.remove();
      });

    hrefs.forEach((href, index) => {
      const id = `${LINK_PREFIX}${index}`;
      const existing = document.getElementById(id) as HTMLLinkElement | null;
      if (existing) {
        if (existing.getAttribute("href") !== href) existing.setAttribute("href", href);
        return;
      }
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = href;
      document.head.appendChild(link);
    });
  }, [fontKey]);

  return null;
}
