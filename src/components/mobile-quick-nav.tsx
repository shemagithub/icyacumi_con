"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CultureIcon } from "@/components/culture-icons";
import { site } from "@/lib/site";

function linkIsActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Mobile primary nav · lives at the bottom; bag & profile stay in the top bar. */
export function MobileQuickNav() {
  const pathname = usePathname();

  if (
    pathname.startsWith("/portal") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/pay/")
  ) {
    return null;
  }

  return (
    <nav className="mobile-quick-nav lg:hidden" aria-label="Primary">
      <ul className="mx-auto flex max-w-lg items-stretch justify-between gap-0.5 px-1 sm:px-2">
        {site.nav.map((link) => {
          const active = linkIsActive(pathname, link.href);
          return (
            <li key={link.href} className="min-w-0 flex-1">
              <Link
                href={link.href}
                className={`relative flex flex-col items-center gap-0.5 px-0.5 py-2 text-center transition-colors ${
                  active ? "text-rust" : "text-coal/75 hover:text-rust"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <CultureIcon name={link.icon} className="h-5 w-5 text-rust" />
                <span className="truncate text-[0.55rem] font-semibold tracking-[0.1em] uppercase sm:text-[0.6rem] sm:tracking-[0.12em]">
                  {link.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
