"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import type { AdminSession } from "@/lib/admin-auth";

const TABS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/brands", label: "Brands" },
  { href: "/admin/clients", label: "Clients" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/ads", label: "Ads" },
  { href: "/admin/payouts", label: "Payouts" },
  { href: "/admin/coupons", label: "Coupons" },
  { href: "/admin/website", label: "Website" },
  { href: "/admin/settings", label: "Commission" },
  { href: "/admin/legal", label: "Legal" },
];

const SIDE_LINKS = [
  { href: "/admin", label: "Overview", icon: "home" },
  { href: "/admin/orders", label: "Orders", icon: "box" },
  { href: "/admin/brands", label: "Brands", icon: "brands" },
  { href: "/admin/clients", label: "Clients", icon: "users" },
  { href: "/admin/products", label: "Products", icon: "box" },
  { href: "/admin/events", label: "Events", icon: "cal" },
  { href: "/admin/ads", label: "Ads", icon: "megaphone" },
  { href: "/admin/payouts", label: "Payouts", icon: "wallet" },
  { href: "/admin/coupons", label: "Coupons", icon: "tag" },
  { href: "/admin/website", label: "Website", icon: "globe" },
  { href: "/admin/settings", label: "Commission", icon: "percent" },
  { href: "/admin/legal", label: "Legal", icon: "doc" },
] as const;

const SIDEBAR_KEY = "bk_admin_sidebar_expanded";

function SideIcon({ name }: { name: (typeof SIDE_LINKS)[number]["icon"] }) {
  const common = "h-5 w-5 shrink-0";
  switch (name) {
    case "home":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z" />
        </svg>
      );
    case "brands":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6" />
        </svg>
      );
    case "users":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "box":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 8-9-5-9 5v8l9 5 9-5V8Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l9 5 9-5M12 13v8" />
        </svg>
      );
    case "cal":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path strokeLinecap="round" d="M3 10h18M8 3v4M16 3v4" />
        </svg>
      );
    case "megaphone":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 11v2a2 2 0 0 0 2 2h1l7 4V5L6 9H5a2 2 0 0 0-2 2Z" />
          <path strokeLinecap="round" d="M19 8a4 4 0 0 1 0 8" />
        </svg>
      );
    case "wallet":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5A2.5 2.5 0 0 1 5.5 5H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5.5A2.5 2.5 0 0 1 3 16.5v-9Z" />
          <path strokeLinecap="round" d="M17 12h.01" />
        </svg>
      );
    case "percent":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 5 5 19" />
          <circle cx="7.5" cy="7.5" r="2.5" />
          <circle cx="16.5" cy="16.5" r="2.5" />
        </svg>
      );
    case "tag":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 12 12 4H5v7l8 8 7-7Z" />
          <circle cx="8.5" cy="8.5" r="1.2" />
        </svg>
      );
    case "doc":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
          <path strokeLinecap="round" d="M14 3v5h5M9 13h6M9 17h6" />
        </svg>
      );
    case "globe":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="9" />
          <path strokeLinecap="round" d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
        </svg>
      );
    default:
      return null;
  }
}

function tabActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname.startsWith(href);
}

export function AdminShell({
  session,
  children,
}: {
  session: AdminSession;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setExpanded(localStorage.getItem(SIDEBAR_KEY) === "1");
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(min-width: 1024px)").matches) return;
    setExpanded(false);
  }, [pathname]);

  function toggleSidebar() {
    setExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  return (
    <div className="portal-app fixed inset-0 z-[90] flex overflow-hidden bg-[var(--portal-bg)] font-sans text-[var(--portal-ink)]">
      <aside
        className={`portal-sidebar z-40 flex flex-col border-r border-black/5 bg-white py-5 transition-[width,transform] duration-300 ease-out ${
          expanded ? "w-[15.5rem] px-3" : "w-[4.25rem] items-center px-0 sm:w-[4.75rem]"
        } ${
          expanded
            ? "fixed inset-y-0 left-0 shadow-xl lg:static lg:shadow-none"
            : "hidden lg:flex"
        } ${ready ? "" : "opacity-0"}`}
      >
        <div
          className={`mb-4 flex w-full items-center gap-2 ${
            expanded ? "justify-between px-1" : "justify-center"
          }`}
        >
          <Link
            href="/admin"
            className={`flex items-center gap-2.5 rounded-2xl bg-[var(--portal-ink)] text-sm font-bold text-white shadow-sm ${
              expanded ? "h-10 flex-1 px-2.5" : "h-10 w-10 justify-center"
            }`}
            aria-label="Admin home"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[var(--portal-accent)] text-xs">
              SA
            </span>
            {expanded ? (
              <span className="truncate text-left text-xs font-semibold tracking-wide">
                Super Admin
              </span>
            ) : null}
          </Link>
          {expanded ? (
            <button
              type="button"
              onClick={toggleSidebar}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-[var(--portal-muted)] hover:bg-black/5"
              aria-label="Collapse sidebar"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          ) : null}
        </div>

        {!expanded ? (
          <button
            type="button"
            onClick={toggleSidebar}
            className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl text-[var(--portal-muted)] hover:bg-black/5"
            aria-label="Expand sidebar"
            aria-expanded={false}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h10" />
            </svg>
          </button>
        ) : null}

        <nav
          className={`flex flex-1 flex-col gap-1.5 ${expanded ? "items-stretch" : "items-center"}`}
          aria-label="Admin sections"
        >
          {SIDE_LINKS.map((link) => {
            const active = tabActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                title={link.label}
                aria-current={active ? "page" : undefined}
                className={`flex items-center rounded-2xl transition-colors ${
                  expanded ? "h-11 gap-3 px-3" : "h-11 w-11 justify-center"
                } ${
                  active
                    ? "bg-[var(--portal-accent)] text-white"
                    : "text-[var(--portal-muted)] hover:bg-black/5 hover:text-[var(--portal-ink)]"
                }`}
              >
                <SideIcon name={link.icon} />
                {expanded ? <span className="truncate text-sm font-medium">{link.label}</span> : null}
              </Link>
            );
          })}
        </nav>

        <div className={`mt-auto flex flex-col gap-1.5 ${expanded ? "items-stretch" : "items-center"}`}>
          <Link
            href="/"
            className={`flex items-center rounded-2xl text-[var(--portal-muted)] hover:bg-black/5 ${
              expanded ? "h-11 gap-3 px-3" : "h-11 w-11 justify-center"
            }`}
          >
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            {expanded ? <span className="text-sm font-medium">Storefront</span> : null}
          </Link>
          <button
            type="button"
            className={`flex items-center rounded-2xl text-[var(--portal-muted)] hover:bg-black/5 hover:text-[var(--portal-accent)] ${
              expanded ? "h-11 gap-3 px-3" : "h-11 w-11 justify-center"
            }`}
            onClick={async () => {
              await logout();
              router.push("/login?next=/admin");
              router.refresh();
            }}
          >
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6A2.25 2.25 0 0 0 5.25 5.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l3 3m0 0-3 3m3-3H3" />
            </svg>
            {expanded ? <span className="text-sm font-medium">Log out</span> : null}
          </button>
        </div>
      </aside>

      {expanded ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/35 lg:hidden"
          aria-label="Close menu"
          onClick={toggleSidebar}
        />
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 flex-wrap items-center gap-3 border-b border-black/5 bg-white/80 px-4 py-3 backdrop-blur-md sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={toggleSidebar}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--portal-muted)] hover:bg-black/5 lg:hidden"
            aria-label="Toggle sidebar"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h10" />
            </svg>
          </button>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight">Super Admin</p>
            <p className="truncate text-[0.7rem] text-[var(--portal-muted)]">Full marketplace control</p>
          </div>

          <nav className="order-last mx-auto flex w-full max-w-3xl overflow-x-auto rounded-full bg-[var(--portal-bg)] p-1 sm:order-none sm:w-auto">
            {TABS.map((tab) => {
              const active = tabActive(pathname, tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`shrink-0 rounded-full px-3 py-2 text-xs font-medium transition-colors sm:px-3.5 ${
                    active
                      ? "bg-[var(--portal-ink)] text-white shadow-sm"
                      : "text-[var(--portal-muted)] hover:text-[var(--portal-ink)]"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <button
              type="button"
              onClick={toggleSidebar}
              className="hidden h-9 items-center gap-2 rounded-full bg-[var(--portal-bg)] px-3 text-xs font-medium text-[var(--portal-muted)] hover:text-[var(--portal-ink)] lg:inline-flex"
            >
              {expanded ? "Collapse" : "Expand"} menu
            </button>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold leading-tight">{session.name}</p>
              <p className="text-[0.7rem] text-[var(--portal-muted)]">{session.email}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--portal-accent)] text-xs font-bold text-white">
              SA
            </div>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
