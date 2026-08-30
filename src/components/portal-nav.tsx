"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/portal", label: "Dashboard" },
  { href: "/portal/products", label: "Products" },
  { href: "/portal/events", label: "Events" },
  { href: "/portal/ads", label: "Ads" },
  { href: "/portal/sales", label: "Sales" },
  { href: "/portal/payments", label: "Earnings" },
];

export function PortalNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2" aria-label="Portal">
      {LINKS.map((link) => {
        const active =
          link.href === "/portal"
            ? pathname === "/portal"
            : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`craft-chip px-3 py-2 text-xs tracking-[0.12em] uppercase ${
              active ? "craft-chip--active" : "craft-chip--idle"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
