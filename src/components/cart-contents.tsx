"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { useCart } from "@/components/cart-provider";
import { ShareCartButton } from "@/components/share-cart-button";
import { loginHref } from "@/lib/auth-redirect";
import { formatPrice } from "@/lib/format";
import { site } from "@/lib/site";

export function CartContents() {
  const { lines, subtotal, hydrated, updateQuantity, removeLine } = useCart();
  const { user } = useAuth();

  const shipping =
    lines.length === 0 || subtotal >= site.freeShippingThreshold ? 0 : site.shippingRate;
  const total = subtotal + shipping;
  const checkoutHref = user?.type === "client" ? "/checkout" : loginHref("/checkout");
  const checkoutLabel =
    user?.type === "client" ? "Proceed to checkout" : "Sign in to checkout";

  if (!hydrated) {
    return (
      <div className="mt-12 space-y-4" aria-busy>
        {[0, 1].map((key) => (
          <div key={key} className="h-32 animate-pulse bg-ash" />
        ))}
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="craft-panel mt-12 bg-bone/80 px-6 py-20 text-center">
        <p className="font-display text-2xl tracking-[0.05em]">Your bag is empty</p>
        <p className="mt-3 text-sm text-bone-dim">
          Nothing in here yet. The line is waiting.
        </p>
        <Link
          href="/shop"
          className="mt-8 craft-btn inline-block bg-rust px-8 py-4 text-xs tracking-[0.2em] text-bone uppercase transition-colors hover:bg-sand"
        >
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-12 grid gap-12 lg:grid-cols-[1.6fr_1fr] lg:gap-20">
      <ul className="divide-y divide-ash-line border-y border-ash-line">
        {lines.map((line) => (
          <li key={line.id} className="flex gap-5 py-6">
            <Link
              href={
                line.kind === "ticket" || line.color === "Ticket"
                  ? `/events/${line.slug}`
                  : `/shop/${line.slug}`
              }
              className="relative aspect-[4/5] w-24 shrink-0 overflow-hidden bg-ash"
            >
              {line.image && (
                <Image
                  src={line.image.src}
                  alt={line.image.alt}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              )}
            </Link>

            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex justify-between gap-4">
                <div className="min-w-0">
                  <Link
                    href={
                      line.kind === "ticket" || line.color === "Ticket"
                        ? `/events/${line.slug}`
                        : `/shop/${line.slug}`
                    }
                    className="font-display text-lg tracking-[0.04em] hover:text-rust"
                  >
                    {line.name}
                  </Link>
                  <p className="mt-1 text-xs tracking-[0.14em] text-bone-dim uppercase">
                    {line.kind === "ticket" || line.color === "Ticket"
                      ? "Event ticket"
                      : `${line.color} / ${line.size}`}
                  </p>
                </div>
                <p className="shrink-0 text-sm tabular-nums">
                  {formatPrice(line.price * line.quantity)}
                </p>
              </div>

              <div className="mt-auto flex items-center justify-between gap-4 pt-4">
                <div className="craft-chip craft-chip--idle flex items-center bg-bone">
                  <button
                    type="button"
                    onClick={() => updateQuantity(line.id, line.quantity - 1)}
                    className="px-3 py-2 text-bone-dim transition-colors hover:text-rust"
                    aria-label={`Decrease quantity of ${line.name}`}
                  >
                    −
                  </button>
                  <span className="min-w-8 text-center text-sm tabular-nums">
                    {line.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(line.id, line.quantity + 1)}
                    className="px-3 py-2 text-bone-dim transition-colors hover:text-rust"
                    aria-label={`Increase quantity of ${line.name}`}
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => removeLine(line.id)}
                  className="text-xs tracking-[0.14em] text-bone-dim uppercase underline underline-offset-4 hover:text-rust"
                >
                  Remove
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <h2 className="font-display text-2xl tracking-[0.05em]">Summary</h2>

        <dl className="mt-6 space-y-3 border-b border-ash-line pb-6 text-sm">
          <div className="flex justify-between">
            <dt className="text-bone-dim">Subtotal</dt>
            <dd className="tabular-nums">{formatPrice(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-bone-dim">Shipping</dt>
            <dd className="tabular-nums">
              {shipping === 0 ? "Free" : formatPrice(shipping)}
            </dd>
          </div>
        </dl>

        <div className="flex justify-between py-6 text-lg">
          <span>Total</span>
          <span className="tabular-nums">{formatPrice(total)}</span>
        </div>

        {shipping > 0 && (
          <p className="mb-4 text-xs text-bone-dim">
            {formatPrice(site.freeShippingThreshold - subtotal)} away from free
            shipping.
          </p>
        )}

        <Link
          href={checkoutHref}
          className="craft-btn block w-full bg-rust px-6 py-4 text-center text-xs tracking-[0.2em] text-bone uppercase transition-colors hover:bg-sand"
        >
          {checkoutLabel}
        </Link>

        {user?.type !== "client" ? (
          <p className="mt-3 text-center text-xs text-bone-dim">
            Your bag is saved on this device. Sign in when you&rsquo;re ready to pay.
          </p>
        ) : null}

        <ShareCartButton />

        <Link
          href="/track"
          className="mt-4 block text-center text-xs tracking-[0.16em] text-bone-dim uppercase underline underline-offset-4 hover:text-rust"
        >
          Track a delivery
        </Link>

        <Link
          href="/shop"
          className="mt-3 block text-center text-xs tracking-[0.16em] text-bone-dim uppercase underline underline-offset-4 hover:text-rust"
        >
          Continue shopping
        </Link>
      </aside>
    </div>
  );
}
