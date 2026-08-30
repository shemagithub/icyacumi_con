"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/components/auth-provider";
import { loginHref } from "@/lib/auth-redirect";

/**
 * Wraps client-only actions (bag, checkout, tickets).
 * Brand owners are sent to their portal instead.
 */
export function RequireClient({
  children,
  message = "Log in as a client to continue.",
}: {
  children: ReactNode;
  message?: string;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (user?.type === "brand") {
      router.replace("/portal");
    }
    if (user?.type === "admin") {
      router.replace("/admin");
    }
  }, [user, loading, router]);

  if (loading) {
    return <p className="py-10 text-sm text-bone-dim">Checking account…</p>;
  }

  if (!user) {
    return (
      <div className="craft-panel mx-auto max-w-md bg-bone/90 px-6 py-12 text-center">
        <p className="font-display text-2xl tracking-[0.05em]">Log in required</p>
        <p className="mt-3 text-sm text-bone-dim">{message}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href={loginHref(pathname)}
            className="craft-btn bg-rust px-6 py-3 text-xs tracking-[0.18em] text-bone uppercase"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="craft-btn-ghost bg-bone px-6 py-3 text-xs tracking-[0.18em] uppercase"
          >
            Create account
          </Link>
        </div>
      </div>
    );
  }

  if (user.type !== "client") {
    return <p className="py-10 text-sm text-bone-dim">Redirecting to brand portal…</p>;
  }

  return <>{children}</>;
}
