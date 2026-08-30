"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { CultureIcon } from "@/components/culture-icons";
import { initialsFromName } from "@/lib/avatar";
import { loginHref } from "@/lib/auth-redirect";

const CLIENT_LINKS = [
  { href: "/account", label: "Overview" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/profile", label: "Profile" },
  { href: "/account/security", label: "Security" },
  { href: "/cart", label: "Bag" },
  { href: "/shop", label: "Shop" },
] as const;

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

  if (loading) {
    return (
      <span
        className="inline-flex min-h-11 min-w-11 items-center justify-center"
        aria-hidden
      >
        <CultureIcon name="person" className="h-7 w-7 text-rust/40 lg:h-5 lg:w-5 xl:h-6 xl:w-6" />
      </span>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2 sm:gap-3">
        <Link
          href={loginHref(pathname)}
          onClick={onNavigate}
          className="inline-flex min-h-11 min-w-11 items-center justify-center text-coal transition-colors hover:text-rust"
          aria-label="Log in"
          title="Log in"
        >
          <CultureIcon name="person" className="h-7 w-7 text-rust lg:h-5 lg:w-5 xl:h-6 xl:w-6" />
        </Link>
        <Link
          href="/register"
          onClick={onNavigate}
          className="hidden rounded-full bg-rust px-3 py-2 text-[0.65rem] font-bold tracking-[0.14em] text-bone uppercase transition-colors hover:bg-sand sm:inline-flex"
        >
          Sign up
        </Link>
      </div>
    );
  }

  if (user.type !== "client") {
    const href = user.type === "admin" ? "/admin" : "/portal";
    const label = user.type === "admin" ? "Admin" : "Portal";
    return (
      <div className="flex items-center gap-2 sm:gap-3">
        <Link
          href={href}
          onClick={onNavigate}
          className="text-xs font-bold tracking-[0.16em] text-coal uppercase transition-colors hover:text-rust"
        >
          {label}
        </Link>
        <button
          type="button"
          onClick={async () => {
            onNavigate?.();
            await logout();
            router.push("/");
            router.refresh();
          }}
          className="text-xs tracking-[0.14em] text-bone-dim uppercase hover:text-rust"
        >
          Log out
        </button>
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
                  onClick={() => {
                    setOpen(false);
                    onNavigate?.();
                  }}
                  className={`block px-4 py-2.5 text-sm transition-colors hover:bg-ash/50 ${
                    pathname === item.href ? "font-semibold text-rust" : "text-coal"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="border-t border-ash-line p-2">
            <button
              type="button"
              role="menuitem"
              onClick={async () => {
                setOpen(false);
                onNavigate?.();
                await logout();
                router.push("/");
                router.refresh();
              }}
              className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-rust hover:bg-rust/10"
            >
              Log out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
