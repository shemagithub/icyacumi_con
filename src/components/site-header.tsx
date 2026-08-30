"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { Container } from "@/components/container";
import { useCart } from "@/components/cart-provider";
import { AccountMenu } from "@/components/account-menu";
import { CultureIcon } from "@/components/culture-icons";
import { SiteSearch } from "@/components/site-search";
import { useSiteSettings } from "@/components/site-settings-provider";
import { site } from "@/lib/site";

function linkIsActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();
  const { count } = useCart();
  const live = useSiteSettings();

  if (pathname.startsWith("/portal") || pathname.startsWith("/admin")) return null;

  return (
      <header className="sticky top-0 z-[60] border-b-2 border-coal bg-bone/92 backdrop-blur-md">
      <Container>
        <div className="flex h-14 items-center gap-3 sm:h-16 sm:gap-4 lg:h-[4.75rem] lg:gap-6">
          <Link
            href="/"
            className="min-w-0 shrink-0"
            aria-label={live.companyName}
          >
            <BrandLogo size="md" priority />
          </Link>

          <nav
            className="ml-1 hidden min-w-0 flex-1 items-center gap-x-0.5 lg:flex xl:ml-2"
            aria-label="Primary"
          >
            {site.nav.map((item, index) => {
              const active = linkIsActive(pathname, item.href);
              return (
                <span key={item.href} className="inline-flex shrink-0 items-center">
                  {index > 0 && (
                    <span
                      className="mx-1.5 select-none text-sm font-bold text-coal/35 xl:mx-2"
                      aria-hidden
                    >
                      ·
                    </span>
                  )}
                  <Link
                    href={item.href}
                    className={`group inline-flex items-center gap-1.5 transition-colors xl:gap-2 ${
                      active ? "text-rust" : "text-coal hover:text-rust"
                    }`}
                    aria-current={active ? "page" : undefined}
                  >
                    <CultureIcon
                      name={item.icon}
                      className={`h-5 w-5 shrink-0 transition-colors xl:h-6 xl:w-6 ${
                        active
                          ? "text-indigo"
                          : "text-rust group-hover:text-indigo"
                      }`}
                    />
                    <span className="font-nav text-[0.95rem] xl:text-[1.05rem]">
                      {item.label}
                    </span>
                  </Link>
                </span>
              );
            })}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-3">
            <SiteSearch />
            <Link
              href="/cart"
              className="group relative inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 text-coal transition-colors hover:text-rust xl:gap-2"
              aria-label={`Bag, ${count} items`}
            >
              <span className="relative inline-flex">
                <CultureIcon
                  name="pot"
                  className="h-7 w-7 text-rust transition-colors group-hover:text-indigo lg:h-5 lg:w-5 xl:h-6 xl:w-6"
                />
                <span
                  className="culture-fire absolute -top-1.5 -right-1.5 flex h-[1.15rem] min-w-[1.15rem] items-center justify-center rounded-full bg-coal px-1 font-sans text-[0.625rem] leading-none font-bold text-bone tabular-nums ring-2 ring-bone sm:-top-1 sm:-right-1 sm:h-4 sm:min-w-4 sm:text-[0.6rem]"
                  aria-hidden
                  suppressHydrationWarning
                >
                  {count}
                </span>
              </span>
              <span className="font-nav hidden text-[0.95rem] xl:inline">
                Bag
              </span>
            </Link>
            <AccountMenu />
          </div>
        </div>
      </Container>
    </header>
  );
}
