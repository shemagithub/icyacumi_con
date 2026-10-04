"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { CartContents } from "@/components/cart-contents";

/** Bag is open to guests · brand/admin accounts stay out of the storefront bag. */
export function CartGate() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (user?.type === "brand") router.replace("/portal");
    if (user?.type === "admin") router.replace("/admin");
  }, [user, loading, router]);

  if (loading) {
    return <p className="py-10 text-sm text-bone-dim">Loading bag…</p>;
  }

  if (user && user.type !== "client") {
    return <p className="py-10 text-sm text-bone-dim">Redirecting…</p>;
  }

  return <CartContents />;
}
