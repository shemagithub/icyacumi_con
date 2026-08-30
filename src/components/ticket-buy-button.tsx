"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { makeLineId, useCart } from "@/components/cart-provider";
import { loginHref } from "@/lib/auth-redirect";
import { saveBuyNowLines } from "@/lib/buy-now";
import { formatPrice } from "@/lib/format";
import type { CartLine, MarketEvent } from "@/lib/types";

export function TicketBuyButton({ event }: { event: MarketEvent }) {
  const { lines, toggleTicket, hydrated } = useCart();
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [message, setMessage] = useState<string | null>(null);
  const soldOut = event.ticketsLeft <= 0;

  const inBag = useMemo(() => {
    if (!hydrated) return false;
    const id = makeLineId(event.id, "OS", "Ticket");
    return lines.some((line) => line.id === id);
  }, [lines, event.id, hydrated]);

  function requireClient(): boolean {
    if (loading) return false;
    if (!user) {
      router.push(loginHref(pathname));
      return false;
    }
    if (user.type === "brand") {
      router.push("/portal");
      return false;
    }
    return true;
  }

  function handleToggle() {
    if (!requireClient()) return;
    const result = toggleTicket(event);
    setMessage(result === "removed" ? "Ticket removed from bag" : "Ticket in bag");
    window.setTimeout(() => setMessage(null), 2800);
  }

  function handleBuyNow() {
    if (!requireClient()) return;
    const line: CartLine = {
      id: makeLineId(event.id, "OS", "Ticket"),
      productId: event.id,
      slug: event.slug,
      name: `${event.title} · ticket`,
      price: event.price,
      size: "OS",
      color: "Ticket",
      image: event.image,
      quantity: 1,
      kind: "ticket",
      stockCap: Math.min(event.ticketsLeft, 10),
    };
    saveBuyNowLines([line]);
    router.push("/checkout");
  }

  if (soldOut) {
    return (
      <p className="craft-panel bg-coal-soft px-5 py-4 text-sm text-bone-dim">
        Sold out · watch for the next date.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          disabled={loading}
          aria-pressed={inBag}
          onClick={handleToggle}
          className={`craft-btn px-8 py-4 text-xs tracking-[0.2em] uppercase transition-colors disabled:opacity-60 ${
            inBag
              ? "bg-coal text-bone hover:bg-sand"
              : "bg-rust text-bone hover:bg-sand"
          }`}
        >
          {!user
            ? `Log in · ${formatPrice(event.price)}`
            : user.type === "brand"
              ? "Brand accounts use portal"
              : inBag
                ? "Remove ticket from bag"
                : `Add ticket · ${formatPrice(event.price)}`}
        </button>
        <button
          type="button"
          disabled={loading || user?.type === "brand"}
          onClick={handleBuyNow}
          className="craft-btn-ghost bg-bone px-8 py-4 text-xs tracking-[0.2em] text-coal uppercase transition-colors hover:text-rust disabled:opacity-60"
        >
          Buy now
        </button>
      </div>
      {message ? (
        <p className="text-sm text-paint-green" role="status">
          {message}
        </p>
      ) : null}
      {user?.type === "client" ? (
        <Link
          href="/cart"
          className="text-xs tracking-[0.16em] text-bone-dim uppercase underline underline-offset-4 hover:text-rust"
        >
          View bag
        </Link>
      ) : (
        <Link
          href="/register"
          className="text-xs tracking-[0.16em] text-bone-dim uppercase underline underline-offset-4 hover:text-rust"
        >
          Create client account
        </Link>
      )}
    </div>
  );
}
