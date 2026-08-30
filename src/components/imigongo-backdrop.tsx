"use client";

import { usePathname } from "next/navigation";

/**
 * Fixed atmosphere: denim twill + Imigongo wash.
 * Keep DOM shape stable (no mount swap) to avoid React removeChild crashes.
 */
export function ImigongoBackdrop() {
  const pathname = usePathname();
  const hidden =
    pathname.startsWith("/portal") || pathname.startsWith("/admin");

  return (
    <div
      className="imigongo-atmosphere"
      aria-hidden="true"
      hidden={hidden}
      style={hidden ? { display: "none" } : undefined}
    >
      <div className="denim-wash" />
      <div className="imigongo-wash" />
      <div className="imigongo-wash imigongo-wash--accent" />
    </div>
  );
}
