"use client";

import { usePathname } from "next/navigation";
import { useSiteSettings } from "@/components/site-settings-provider";

/**
 * Fixed atmosphere: denim, Imigongo, or admin-uploaded art.
 * Keep DOM shape stable (no mount swap) to avoid React removeChild crashes.
 */
export function ImigongoBackdrop() {
  const pathname = usePathname();
  const { theme } = useSiteSettings();
  const custom = theme.pattern === "custom" && Boolean(theme.patternArtUrl);
  const hidden =
    pathname.startsWith("/portal") ||
    pathname.startsWith("/admin") ||
    theme.pattern === "none" ||
    theme.pattern === "grid" ||
    (theme.pattern === "custom" && !theme.patternArtUrl);

  return (
    <div
      className="imigongo-atmosphere"
      aria-hidden="true"
      hidden={hidden}
      style={hidden ? { display: "none" } : undefined}
    >
      {theme.pattern === "denim" || theme.pattern === "imigongo" ? (
        <div className="denim-wash" />
      ) : null}
      {theme.pattern === "imigongo" ? (
        <>
          <div className="imigongo-wash" />
          <div className="imigongo-wash imigongo-wash--accent" />
        </>
      ) : null}
      {custom ? (
        <div
          className={`custom-art-wash ${theme.patternArtFit === "tile" ? "custom-art-wash--tile" : ""}`}
          style={{ backgroundImage: `url(${JSON.stringify(theme.patternArtUrl)})` }}
        />
      ) : null}
    </div>
  );
}
