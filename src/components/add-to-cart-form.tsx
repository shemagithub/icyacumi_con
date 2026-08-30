"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { makeLineId, useCart } from "@/components/cart-provider";
import { loginHref } from "@/lib/auth-redirect";
import { saveBuyNowLines } from "@/lib/buy-now";
import { formatPrice } from "@/lib/format";
import type { CartLine, Product, Size } from "@/lib/types";

function buildLine(product: Product, size: Size, color: string): CartLine {
  return {
    id: makeLineId(product.id, size, color),
    productId: product.id,
    slug: product.slug,
    name: product.name,
    price: product.price,
    size,
    color,
    image: product.images[0],
    quantity: 1,
    kind: "product",
    stockCap: Math.max(1, Math.min(99, product.stockQuantity)),
  };
}

export function AddToCartForm({ product }: { product: Product }) {
  const { lines, toggleLine, hydrated } = useCart();
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const onlyOneSize = product.sizes.length === 1;

  const [size, setSize] = useState<Size | null>(onlyOneSize ? product.sizes[0] : null);
  const [color, setColor] = useState(product.colors[0].name);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const inBag = useMemo(() => {
    if (!size || !hydrated) return false;
    const id = makeLineId(product.id, size, color);
    return lines.some((line) => line.id === id);
  }, [lines, product.id, size, color, hydrated]);

  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  function flash(text: string) {
    setMessage(text);
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setMessage(null), 2800);
  }

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

  function handleToggleBag(event: React.FormEvent) {
    event.preventDefault();
    if (!requireClient()) return;
    if (!size) {
      setError("Choose a size first.");
      return;
    }

    const result = toggleLine({ product, size, color });
    setError(null);
    flash(result === "removed" ? "Removed from bag" : "Added to bag");
  }

  function handleBuyNow() {
    if (!requireClient()) return;
    if (!size) {
      setError("Choose a size first.");
      return;
    }
    setError(null);
    saveBuyNowLines([buildLine(product, size, color)]);
    router.push("/checkout");
  }

  if (!product.inStock) {
    return (
      <div className="craft-panel mt-8 bg-coal-soft p-5">
        <p className="font-display text-lg tracking-[0.06em] text-coal">Sold out</p>
        <p className="mt-1 text-sm text-bone-dim">
          This one ran out. Join the list in the footer and we&rsquo;ll say when it
          returns.
        </p>
      </div>
    );
  }

  const bagLabel = !user
    ? "Log in to add"
    : user.type === "brand"
      ? "Use brand portal"
      : inBag
        ? "Remove from bag"
        : "Add to bag";

  return (
    <form onSubmit={handleToggleBag} className="mt-8">
      <fieldset>
        <legend className="eyebrow mb-3">Colour · {color}</legend>
        <div className="flex flex-wrap gap-2">
          {product.colors.map((option) => (
            <button
              key={option.name}
              type="button"
              onClick={() => setColor(option.name)}
              aria-pressed={color === option.name}
              className={`craft-chip flex items-center gap-2 px-3 py-2 text-xs tracking-[0.1em] uppercase transition-colors ${
                color === option.name
                  ? "craft-chip--active"
                  : "craft-chip--idle text-bone-dim hover:text-coal"
              }`}
            >
              <span
                className="h-3 w-3 rounded-full ring-1 ring-ash-line"
                style={{ backgroundColor: option.hex }}
              />
              {option.name}
            </button>
          ))}
        </div>
      </fieldset>

      {!onlyOneSize && (
        <fieldset className="mt-6">
          <legend className="eyebrow mb-3">Size</legend>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  setSize(option);
                  setError(null);
                }}
                aria-pressed={size === option}
                className={`craft-chip min-w-14 px-3 py-2 text-xs tracking-[0.1em] uppercase transition-colors ${
                  size === option
                    ? "craft-chip--active"
                    : "craft-chip--idle text-bone-dim hover:text-coal"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {error ? <p className="mt-4 text-sm text-rust">{error}</p> : null}
      {message ? (
        <p className="mt-4 text-sm text-paint-green" role="status">
          {message}
        </p>
      ) : null}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={loading}
          aria-pressed={inBag}
          className={`craft-btn flex-1 px-6 py-4 text-xs tracking-[0.2em] uppercase transition-colors disabled:opacity-60 ${
            inBag
              ? "bg-coal text-bone hover:bg-sand"
              : "bg-rust text-bone hover:bg-sand"
          }`}
        >
          {bagLabel}
        </button>
        <button
          type="button"
          disabled={loading || user?.type === "brand"}
          onClick={handleBuyNow}
          className="craft-btn-ghost flex-1 bg-bone px-6 py-4 text-xs tracking-[0.2em] text-coal uppercase transition-colors hover:text-rust disabled:opacity-60"
        >
          {!user
            ? `Log in to buy · ${formatPrice(product.price)}`
            : user.type === "brand"
              ? "Use brand portal"
              : `Buy now · ${formatPrice(product.price)}`}
        </button>
      </div>

      {user?.type === "client" ? (
        <Link
          href="/cart"
          className="mt-4 inline-block text-xs tracking-[0.16em] text-bone-dim uppercase underline underline-offset-4 hover:text-rust"
        >
          {inBag ? "View bag" : "Open bag"}
        </Link>
      ) : (
        <Link
          href={loginHref(pathname)}
          className="mt-4 inline-block text-xs tracking-[0.16em] text-bone-dim uppercase underline underline-offset-4 hover:text-rust"
        >
          Create / log in
        </Link>
      )}

      <p aria-live="polite" className="sr-only">
        {message ?? ""}
      </p>
    </form>
  );
}
