"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CultureIcon, type CultureIconName } from "@/components/culture-icons";
import { useResolvedAtmosphere } from "@/lib/use-resolved-atmosphere";

const MOBILE_NAV: {
  href: string;
  label: string;
  short: string;
  icon: CultureIconName;
}[] = [
  { href: "/", label: "Home", short: "Home", icon: "hut" },
  { href: "/shop", label: "Shop", short: "Shop", icon: "cloth" },
  { href: "/brands", label: "Brands", short: "Brands", icon: "necklace" },
  { href: "/events", label: "Events", short: "Event", icon: "drum" },
  { href: "/ads", label: "Ads", short: "Ads", icon: "mask" },
];

function linkIsActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function shouldHide(pathname: string) {
  return (
    pathname.startsWith("/portal") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/pay/")
  );
}

function isSummer(atmosphere: string | undefined) {
  return atmosphere === "summer-day" || atmosphere === "summer-night";
}

function isWinter(atmosphere: string | undefined) {
  return atmosphere === "winter-day" || atmosphere === "winter-night";
}

/** Mobile primary nav · seasonal sweat / frost character on the active tab. */
export function MobileQuickNav() {
  const pathname = usePathname();
  const atmosphere = useResolvedAtmosphere();
  const seasonAttr = atmosphere === "off" ? undefined : atmosphere;

  if (shouldHide(pathname)) return null;

  return (
    <>
      <div className="mobile-quick-nav-space lg:hidden" aria-hidden />
      <nav
        className="mobile-quick-nav lg:hidden"
        aria-label="Primary"
        data-atmosphere={seasonAttr}
      >
        <ul className="mobile-quick-nav__dock">
          {MOBILE_NAV.map((link) => {
            const active = linkIsActive(pathname, link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  prefetch
                  className="mobile-quick-nav__link"
                  aria-label={link.label}
                  aria-current={active ? "page" : undefined}
                >
                  <span className="mobile-quick-nav__icon" aria-hidden>
                    <CultureIcon name={link.icon} className="h-5 w-5" />
                    {active && isSummer(seasonAttr) ? (
                      <span className="mobile-quick-nav__sweat">
                        <i />
                        <i />
                        <i />
                      </span>
                    ) : null}
                    {active && isWinter(seasonAttr) ? (
                      <span className="mobile-quick-nav__frost">
                        <i />
                        <i />
                        <i />
                        <i />
                      </span>
                    ) : null}
                  </span>
                  <span className="font-nav mobile-quick-nav__label">
                    {link.short}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
