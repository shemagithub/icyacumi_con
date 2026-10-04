"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { CultureIcon } from "@/components/culture-icons";
import { loginHref } from "@/lib/auth-redirect";

export function AuthNavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  if (loading) {
    return (
      <span className="hidden text-xs tracking-[0.14em] text-bone-dim uppercase lg:inline">
        …
      </span>
    );
  }

  if (!user) {
    return (
      <Link
        href={loginHref(pathname)}
        onClick={onNavigate}
        className="font-nav hidden text-[0.9rem] text-coal transition-colors hover:text-rust lg:inline"
      >
        Log in
      </Link>
    );
  }

  const href =
    user.type === "admin" ? "/admin" : user.type === "brand" ? "/portal" : "/account";
  const label =
    user.type === "admin" ? "Admin" : user.type === "brand" ? "Portal" : "Account";

  return (
    <div className="hidden items-center gap-3 lg:flex">
      <Link
        href={href}
        onClick={onNavigate}
        className="font-nav text-[0.9rem] text-coal transition-colors hover:text-rust"
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
        className="inline-flex min-h-9 min-w-9 items-center justify-center text-bone-dim transition-colors hover:text-rust"
        aria-label="Log out"
        title="Log out"
      >
        <CultureIcon name="logout" className="h-5 w-5" />
      </button>
    </div>
  );
}
