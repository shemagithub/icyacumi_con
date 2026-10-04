"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { CultureIcon } from "@/components/culture-icons";
import type { AdminSession } from "@/lib/admin-auth";

function adminInitial(session: AdminSession) {
  const name = session.name.trim();
  if (name) return name[0]!.toUpperCase();
  const email = session.email.trim();
  if (email) return email[0]!.toUpperCase();
  return "A";
}

function AdminAvatar({
  session,
  size = "md",
}: {
  session: AdminSession;
  size?: "sm" | "md";
}) {
  const letter = adminInitial(session);
  const box = size === "sm" ? "h-7 w-7 text-[0.7rem]" : "h-10 w-10 text-sm";
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-[var(--portal-accent)] font-bold tracking-wide text-white ${box}`}
      title={session.name || session.email}
      aria-label={session.name ? `${session.name} avatar` : "Admin avatar"}
    >
      {letter}
    </div>
  );
}

const NAV_GROUPS = [
  {
    title: "Marketplace",
    links: [
      { href: "/admin", label: "Overview", icon: "home" },
      { href: "/admin/brands", label: "Brands", icon: "brands" },
      { href: "/admin/clients", label: "Clients", icon: "users" },
      { href: "/admin/products", label: "Products", icon: "box" },
    ],
  },
  {
    title: "Commerce",
    links: [
      { href: "/admin/orders", label: "Orders", icon: "receipt" },
      { href: "/admin/events", label: "Events", icon: "cal" },
      { href: "/admin/ads", label: "Ads", icon: "megaphone" },
      { href: "/admin/coupons", label: "Coupons", icon: "tag" },
    ],
  },
  {
    title: "Money",
    links: [
      { href: "/admin/money", label: "Brand money", icon: "coins" },
      { href: "/admin/payouts", label: "Payouts", icon: "wallet" },
      { href: "/admin/settings", label: "Commission", icon: "percent" },
    ],
  },
  {
    title: "Platform",
    links: [
      { href: "/admin/website", label: "Website", icon: "globe" },
      { href: "/admin/design", label: "Design", icon: "palette" },
      { href: "/admin/legal", label: "Legal", icon: "doc" },
      { href: "/admin/admins", label: "Admins", icon: "shield" },
    ],
  },
] as const;

type SideIconName = (typeof NAV_GROUPS)[number]["links"][number]["icon"];

const SIDEBAR_KEY = "bk_admin_sidebar_expanded";

function SideIcon({ name }: { name: SideIconName }) {
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
          <path strokeLinecap="round" d="M3 8l9 5 9-5M12 13v8" />
        </svg>
      );
    case "receipt":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 3h12v18l-2-1.2L14 21l-2-1.2L10 21l-2-1.2L6 21V3Z" />
          <path strokeLinecap="round" d="M9 8h6M9 12h6M9 16h3.5" />
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
    case "coins":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <ellipse cx="8.5" cy="7" rx="5.5" ry="3" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v4c0 1.66 2.46 3 5.5 3s5.5-1.34 5.5-3V7" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 11v4c0 1.66 2.46 3 5.5 3s5.5-1.34 5.5-3v-4" />
          <ellipse cx="15.5" cy="10" rx="5.5" ry="3" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 10v4c0 1.66-2.46 3-5.5 3S10 15.66 10 14v-1.2" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 14v4c0 1.66-2.46 3-5.5 3S10 19.66 10 18v-2" />
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
    case "palette":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3a9 9 0 1 0 0 18h1.5a2 2 0 0 0 0-4H12a3 3 0 0 1 0-6 3 3 0 0 0 3-3V7a4 4 0 0 0-3-4Z" />
          <circle cx="7.5" cy="10" r="1" fill="currentColor" />
          <circle cx="9.5" cy="7" r="1" fill="currentColor" />
          <circle cx="8" cy="14" r="1" fill="currentColor" />
        </svg>
      );
    case "shield":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3 5 6v6c0 4.2 2.8 7.4 7 8.5 4.2-1.1 7-4.3 7-8.5V6l-7-3Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="m9 12 2 2 4-4" />
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

function pageMeta(pathname: string) {
  for (const group of NAV_GROUPS) {
    for (const link of group.links) {
      if (tabActive(pathname, link.href)) {
        return { title: link.label, group: group.title };
      }
    }
  }
  if (pathname.startsWith("/admin/profile")) {
    return { title: "Profile", group: "Account" };
  }
  return { title: "Admin", group: "Platform" };
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
  const { logout, user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [ready, setReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const meta = pageMeta(pathname);
  const live: AdminSession =
    user?.type === "admin"
      ? {
          type: "admin",
          userId: user.userId,
          email: user.email,
          name: user.name,
        }
      : session;

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_KEY);
      if (stored === null) {
        setExpanded(window.matchMedia("(min-width: 1024px)").matches);
      } else {
        setExpanded(stored === "1");
      }
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

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointer = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

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

  async function onLogout() {
    setMenuOpen(false);
    await logout();
    router.push("/login?next=/admin");
    router.refresh();
  }

  return (
    <div className="portal-app admin-app fixed inset-0 z-[90] flex overflow-hidden font-sans text-[var(--portal-ink)]">
      <aside
        className={`admin-sidebar z-40 flex flex-col py-5 transition-[width,transform] duration-300 ease-out ${
          expanded ? "w-[16.5rem] px-3" : "w-[4.25rem] items-center px-0 sm:w-[4.75rem]"
        } ${
          expanded
            ? "fixed inset-y-0 left-0 shadow-xl lg:static lg:shadow-none"
            : "hidden lg:flex"
        } ${ready ? "" : "opacity-0"}`}
      >
        <div
          className={`mb-5 flex w-full items-center gap-2 ${
            expanded ? "justify-between px-1" : "justify-center"
          }`}
        >
          <Link
            href="/admin"
            className={`flex items-center gap-2.5 rounded-2xl bg-white/10 text-sm font-bold text-white ${
              expanded ? "h-11 flex-1 px-2.5" : "h-11 w-11 justify-center"
            }`}
            aria-label="Admin home"
          >
            <span className="inline-flex shrink-0">
              <AdminAvatar session={live} size="sm" />
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
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-[var(--admin-sidebar-muted)] hover:bg-white/10 hover:text-white"
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
            className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl text-[var(--admin-sidebar-muted)] hover:bg-white/10 hover:text-white"
            aria-label="Expand sidebar"
            aria-expanded={false}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h10" />
            </svg>
          </button>
        ) : null}

        <nav
          className={`min-h-0 flex-1 overflow-y-auto ${expanded ? "space-y-4 pr-0.5" : "space-y-3"}`}
          aria-label="Admin sections"
        >
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className={expanded ? "space-y-1" : "space-y-1.5"}>
              {expanded ? (
                <p className="px-3 pt-1 text-[0.62rem] font-bold tracking-[0.16em] text-[var(--admin-sidebar-muted)] uppercase">
                  {group.title}
                </p>
              ) : (
                <div className="mx-auto h-px w-6 bg-white/10" aria-hidden />
              )}
              <div className={`flex flex-col gap-1 ${expanded ? "items-stretch" : "items-center"}`}>
                {group.links.map((link) => {
                  const active = tabActive(pathname, link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      title={link.label}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center rounded-2xl transition-colors ${
                        expanded ? "h-10 gap-3 px-3" : "h-11 w-11 justify-center"
                      } ${
                        active
                          ? "bg-[var(--portal-accent)] text-white"
                          : "text-[var(--admin-sidebar-muted)] hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <SideIcon name={link.icon} />
                      {expanded ? <span className="truncate text-sm font-medium">{link.label}</span> : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className={`mt-auto flex flex-col gap-1.5 pt-3 ${expanded ? "items-stretch" : "items-center"}`}>
          <Link
            href="/"
            className={`flex items-center rounded-2xl text-[var(--admin-sidebar-muted)] hover:bg-white/10 hover:text-white ${
              expanded ? "h-10 gap-3 px-3" : "h-11 w-11 justify-center"
            }`}
          >
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            {expanded ? <span className="text-sm font-medium">Storefront</span> : null}
          </Link>
          <button
            type="button"
            className={`flex items-center rounded-2xl text-[var(--admin-sidebar-muted)] hover:bg-white/10 hover:text-[var(--portal-accent)] ${
              expanded ? "h-10 gap-3 px-3" : "h-11 w-11 justify-center"
            }`}
            onClick={async () => {
              await logout();
              router.push("/login?next=/admin");
              router.refresh();
            }}
          >
            <CultureIcon name="logout" className="h-5 w-5 shrink-0" />
            {expanded ? <span className="text-sm font-medium">Log out</span> : null}
          </button>
        </div>
      </aside>

      {expanded ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/45 lg:hidden"
          aria-label="Close menu"
          onClick={toggleSidebar}
        />
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center gap-3 border-b border-[var(--portal-line)] bg-white/75 px-4 py-3 backdrop-blur-md sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={toggleSidebar}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-[var(--portal-muted)] hover:bg-black/5 lg:hidden"
            aria-label="Toggle sidebar"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h10" />
            </svg>
          </button>

          <div className="min-w-0">
            <p className="text-[0.65rem] font-bold tracking-[0.16em] text-[var(--portal-muted)] uppercase">
              {meta.group}
            </p>
            <p className="truncate text-base font-semibold tracking-tight">{meta.title}</p>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <button
              type="button"
              onClick={toggleSidebar}
              className="hidden h-9 items-center gap-2 rounded-full border border-[var(--portal-line)] bg-white/60 px-3 text-xs font-medium text-[var(--portal-muted)] hover:text-[var(--portal-ink)] lg:inline-flex"
            >
              {expanded ? "Collapse" : "Expand"} menu
            </button>

            <div ref={menuRef} className="relative">
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-controls={menuId}
                onClick={() => setMenuOpen((value) => !value)}
                className="flex items-center gap-2.5 rounded-full border border-[var(--portal-line)] bg-white/80 py-1 pr-2 pl-1 transition-colors hover:border-[var(--portal-accent)]/40"
              >
                <div className="hidden text-right sm:block sm:pl-2">
                  <p className="text-sm font-semibold leading-tight">{live.name}</p>
                  <p className="text-[0.7rem] text-[var(--portal-muted)]">{live.email}</p>
                </div>
                <AdminAvatar session={live} size="md" />
              </button>

              {menuOpen ? (
                <div
                  id={menuId}
                  role="menu"
                  className="absolute top-[calc(100%+0.45rem)] right-0 z-50 w-[15rem] overflow-hidden rounded-2xl border border-[var(--portal-line)] bg-white shadow-[0_16px_40px_rgba(17,17,17,0.14)]"
                >
                  <div className="border-b border-[var(--portal-line)] px-4 py-3 sm:hidden">
                    <p className="truncate text-sm font-semibold">{live.name}</p>
                    <p className="mt-0.5 truncate text-xs text-[var(--portal-muted)]">
                      {live.email}
                    </p>
                  </div>
                  <ul className="py-1">
                    <li>
                      <Link
                        href="/admin/profile"
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                        className={`flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:bg-black/5 ${
                          pathname.startsWith("/admin/profile")
                            ? "font-semibold text-[var(--portal-accent)]"
                            : "text-[var(--portal-ink)]"
                        }`}
                      >
                        <CultureIcon name="person" className="h-4 w-4 shrink-0" />
                        Profile
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/admin/orders"
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                        className={`flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:bg-black/5 ${
                          pathname.startsWith("/admin/orders")
                            ? "font-semibold text-[var(--portal-accent)]"
                            : "text-[var(--portal-ink)]"
                        }`}
                      >
                        <CultureIcon name="spiral" className="h-4 w-4 shrink-0" />
                        Orders
                      </Link>
                    </li>
                  </ul>
                  <div className="border-t border-[var(--portal-line)] p-2">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => void onLogout()}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-[var(--portal-accent)] hover:bg-orange-50"
                    >
                      <CultureIcon name="logout" className="h-4 w-4 shrink-0" />
                      Log out
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <div className="admin-canvas min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
