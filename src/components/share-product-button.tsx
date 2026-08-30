"use client";

import { useEffect, useMemo, useState } from "react";
import {
  buildProductShareText,
  productShareUrl,
  shareChannelHref,
} from "@/lib/share-product";
import type { Product } from "@/lib/types";

export function ShareProductButton({
  product,
  brandName,
  originCity,
}: {
  product: Product;
  brandName: string;
  originCity?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<"link" | "caption" | null>(null);
  const [canNative, setCanNative] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    setCanNative(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  const url = useMemo(
    () => productShareUrl(product.slug, origin || undefined),
    [product.slug, origin],
  );

  const caption = useMemo(
    () =>
      buildProductShareText({
        product,
        brandName,
        originCity,
        url,
      }),
    [product, brandName, originCity, url],
  );

  async function copy(kind: "link" | "caption") {
    try {
      await navigator.clipboard.writeText(kind === "link" ? url : caption);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  }

  async function nativeShare() {
    try {
      await navigator.share({
        title: product.name,
        text: caption,
        url,
      });
    } catch {
      // User cancelled or share failed · ignore.
    }
  }

  const channels = [
    {
      key: "whatsapp" as const,
      label: "WhatsApp",
      href: shareChannelHref("whatsapp", caption, url),
    },
    {
      key: "telegram" as const,
      label: "Telegram",
      href: shareChannelHref("telegram", caption, url),
    },
    {
      key: "x" as const,
      label: "X",
      href: shareChannelHref("x", caption, url),
    },
    {
      key: "facebook" as const,
      label: "Facebook",
      href: shareChannelHref("facebook", caption, url),
    },
    {
      key: "sms" as const,
      label: "SMS",
      href: shareChannelHref("sms", caption, url),
    },
  ];

  return (
    <div className="mt-6">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="craft-btn-ghost w-full px-6 py-3.5 text-xs tracking-[0.2em] uppercase"
        >
          Share product
        </button>
      ) : (
        <div className="rounded-xl border border-ash-line bg-ash/30 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-coal">Share this piece</p>
              <p className="mt-1 text-xs leading-relaxed text-bone-dim">
                Sends name, brand, price, origin, and the product link · ready for
                WhatsApp, Instagram, and more.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-[0.65rem] tracking-[0.14em] text-bone-dim uppercase underline"
            >
              Close
            </button>
          </div>

          <pre className="mt-4 max-h-36 overflow-auto rounded-lg border border-ash-line bg-bone px-3 py-3 text-left text-[0.7rem] leading-relaxed whitespace-pre-wrap text-coal">
            {caption}
          </pre>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {channels.map((channel) => (
              <a
                key={channel.key}
                href={channel.href}
                target="_blank"
                rel="noopener noreferrer"
                className="craft-chip craft-chip--idle px-3 py-2.5 text-center text-[0.65rem] tracking-[0.12em] uppercase hover:border-rust hover:text-rust"
              >
                {channel.label}
              </a>
            ))}
            <button
              type="button"
              onClick={() => void copy("caption")}
              className="craft-chip craft-chip--idle px-3 py-2.5 text-[0.65rem] tracking-[0.12em] uppercase hover:border-rust hover:text-rust"
              title="Instagram has no web share link · copy caption, then paste in Stories, DM, or post"
            >
              {copied === "caption" ? "Copied" : "Instagram"}
            </button>
            <button
              type="button"
              onClick={() => void copy("link")}
              className="craft-chip craft-chip--idle px-3 py-2.5 text-[0.65rem] tracking-[0.12em] uppercase hover:border-rust hover:text-rust"
            >
              {copied === "link" ? "Link copied" : "Copy link"}
            </button>
          </div>

          <p className="mt-3 text-[0.65rem] leading-relaxed text-bone-dim">
            Instagram: tap Instagram to copy the caption, open the app, and paste into
            a Story, DM, or post.
          </p>

          {canNative ? (
            <button
              type="button"
              onClick={() => void nativeShare()}
              className="craft-btn mt-4 w-full bg-rust px-4 py-3 text-[0.65rem] tracking-[0.16em] text-bone uppercase hover:bg-sand"
            >
              Share via device…
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
