"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { CultureIcon, type CultureIconName } from "@/components/culture-icons";
import { initialsFromName } from "@/lib/avatar";
import { loginHref } from "@/lib/auth-redirect";

type MenuLink = {
  href: string;
  label: string;
  icon: CultureIconName;
};

const CLIENT_LINKS: MenuLink[] = [
  { href: "/account/profile", label: "Profile", icon: "person" },
  { href: "/account/orders", label: "Orders", icon: "spiral" },
  { href: "/account/security", label: "Security", icon: "shield" },
  { href: "/account", label: "Overview", icon: "necklace" },
];

function linkActive(pathname: string, href: string) {
  if (href === "/account") return pathname === "/account";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AccountMenu({ onNavigate }: { onNavigate?: () => void }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function close() {
    setOpen(false);
    onNavigate?.();
  }

  async function onLogout() {
    close();
    await logout();
    router.push("/");
    router.refresh();
  }

  const triggerClass =
    "inline-flex min-h-11 min-w-11 items-center justify-center text-coal transition-colors hover:text-rust";

  /* Guest (or still checking session): go straight to sign in */
  if (loading || !user) {
    return (
      <Link
        href={loginHref(pathname)}
        onClick={onNavigate}
        className={triggerClass}
        aria-label="Sign in"
        title="Sign in"
      >
        <CultureIcon
          name="person"
          className={`h-7 w-7 text-rust lg:h-5 lg:w-5 xl:h-6 xl:w-6 ${
            loading ? "opacity-50" : ""
          }`}
        />
      </Link>
    );
  }

  /* Admin / brand: Profile · Orders · Log out → their dashboards */
  if (user.type !== "client") {
    const isAdmin = user.type === "admin";
    const staffLinks: MenuLink[] = isAdmin
      ? [
          { href: "/admin/profile", label: "Profile", icon: "person" },
          { href: "/admin/orders", label: "Orders", icon: "spiral" },
        ]
      : [
          { href: "/portal/profile", label: "Profile", icon: "person" },
          { href: "/portal/sales", label: "Orders", icon: "spiral" },
        ];
    const homeHref = isAdmin ? "/admin" : "/portal";
    const homeLabel = isAdmin ? "Admin" : "Portal";
    const initial = (user.name.trim()[0] || user.email[0] || "?").toUpperCase();

    return (
      <div ref={rootRef} className="relative">
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => setOpen((value) => !value)}
          className="inline-flex items-center gap-2 rounded-full border border-ash-line bg-bone py-1 pr-2.5 pl-1 transition-colors hover:border-rust"
          aria-label="Account menu"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ash text-[0.7rem] font-bold text-coal">
            {initial}
          </span>
          <span className="hidden max-w-[7rem] truncate text-xs font-bold tracking-[0.08em] text-coal uppercase sm:inline">
            {user.name.split(" ")[0] || homeLabel}
          </span>
          <CultureIcon
            name="spiral"
            className={`h-3.5 w-3.5 text-rust transition-transform ${open ? "rotate-90" : ""}`}
          />
        </button>

        {open ? (
          <div
            id={menuId}
            role="menu"
            className="absolute top-[calc(100%+0.5rem)] right-0 z-[220] w-[15.5rem] overflow-hidden rounded-xl border border-ash-line bg-bone shadow-[0_18px_40px_rgba(17,17,17,0.18)]"
          >
            <div className="border-b border-ash-line px-4 py-3">
              <p className="truncate text-sm font-semibold text-coal">{user.name}</p>
              <p className="mt-0.5 truncate text-xs text-bone-dim">{user.email}</p>
            </div>
            <ul className="py-1">
              {staffLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    role="menuitem"
                    onClick={close}
                    className={`flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:bg-ash/50 ${
                      linkActive(pathname, item.href)
                        ? "font-semibold text-rust"
                        : "text-coal"
                    }`}
                  >
                    <CultureIcon name={item.icon} className="h-4 w-4 shrink-0" />
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href={homeHref}
                  role="menuitem"
                  onClick={close}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-coal transition-colors hover:bg-ash/50"
                >
                  <CultureIcon name="necklace" className="h-4 w-4 shrink-0" />
                  {homeLabel} home
                </Link>
              </li>
            </ul>
            <div className="border-t border-ash-line p-2">
              <button
                type="button"
                role="menuitem"
                onClick={() => void onLogout()}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-rust hover:bg-rust/10"
              >
                <CultureIcon name="logout" className="h-5 w-5 shrink-0" />
                Log out
              </button>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  const initials = initialsFromName(user.name);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-2 rounded-full border border-ash-line bg-bone py-1 pr-2.5 pl-1 transition-colors hover:border-rust"
        aria-label="Account menu"
      >
        <span className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-ash text-[0.7rem] font-bold text-coal">
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatarUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            initials
          )}
        </span>
        <span className="hidden max-w-[7rem] truncate text-xs font-bold tracking-[0.08em] text-coal uppercase sm:inline">
          {user.name.split(" ")[0]}
        </span>
        <CultureIcon
          name="spiral"
          className={`h-3.5 w-3.5 text-rust transition-transform ${open ? "rotate-90" : ""}`}
        />
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute top-[calc(100%+0.5rem)] right-0 z-[220] w-[15.5rem] overflow-hidden rounded-xl border border-ash-line bg-bone shadow-[0_18px_40px_rgba(17,17,17,0.18)]"
        >
          <div className="border-b border-ash-line px-4 py-3">
            <p className="truncate text-sm font-semibold text-coal">{user.name}</p>
            <p className="mt-0.5 truncate text-xs text-bone-dim">{user.email}</p>
          </div>
          <ul className="py-1">
            {CLIENT_LINKS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  role="menuitem"
                  onClick={close}
                  className={`flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:bg-ash/50 ${
                    linkActive(pathname, item.href)
                      ? "font-semibold text-rust"
                      : "text-coal"
                  }`}
                >
                  <CultureIcon name={item.icon} className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="border-t border-ash-line p-2">
            <button
              type="button"
              role="menuitem"
              onClick={() => void onLogout()}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-rust hover:bg-rust/10"
            >
              <CultureIcon name="logout" className="h-5 w-5 shrink-0" />
              Log out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
