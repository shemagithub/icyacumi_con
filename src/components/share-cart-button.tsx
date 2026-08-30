"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useCart } from "@/components/cart-provider";

export function ShareCartButton() {
  const { lines } = useCart();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function createShare() {
    if (!lines.length) return;
    setPending(true);
    setError(null);
    setCopied(false);
    try {
      const response = await fetch("/api/catalog/shared-carts", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines,
          message: message.trim() || undefined,
          ownerName: user?.type === "client" ? user.name : undefined,
          ownerEmail: user?.type === "client" ? user.email : undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Could not create share link.");
        return;
      }
      const path = data.sharedCart?.path as string;
      const url = `${window.location.origin}${path}`;
      setShareUrl(url);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setPending(false);
    }
  }

  async function copyLink() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mt-4">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="craft-btn-ghost w-full px-6 py-4 text-xs tracking-[0.2em] uppercase"
        >
          Share bag · ask someone to pay
        </button>
      ) : (
        <div className="rounded-xl border border-ash-line bg-ash/30 p-4">
          <p className="text-sm font-medium text-coal">Share this bag</p>
          <p className="mt-1 text-xs leading-relaxed text-bone-dim">
            Send a link. Anyone can open it and pay · with or without an account.
            Link expires in 7 days.
          </p>
          <label className="mt-3 block">
            <span className="eyebrow mb-2 block">Note (optional)</span>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={2}
              className="field-input resize-y text-sm"
              placeholder="Birthday gift · thank you for covering this!"
            />
          </label>

          {shareUrl ? (
            <div className="mt-3 space-y-2">
              <input
                readOnly
                value={shareUrl}
                className="field-input text-xs"
                onFocus={(event) => event.currentTarget.select()}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void copyLink()}
                  className="craft-btn flex-1 bg-rust px-4 py-3 text-[0.65rem] tracking-[0.16em] text-bone uppercase"
                >
                  {copied ? "Copied" : "Copy link"}
                </button>
                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="craft-btn-ghost flex-1 px-4 py-3 text-center text-[0.65rem] tracking-[0.16em] uppercase"
                >
                  Open
                </a>
              </div>
            </div>
          ) : (
            <button
              type="button"
              disabled={pending || lines.length === 0}
              onClick={() => void createShare()}
              className="craft-btn mt-3 w-full bg-rust px-4 py-3 text-[0.65rem] tracking-[0.16em] text-bone uppercase disabled:opacity-60"
            >
              {pending ? "Creating link…" : "Create share link"}
            </button>
          )}

          {error ? <p className="mt-2 text-sm text-rust">{error}</p> : null}

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setShareUrl(null);
              setError(null);
            }}
            className="mt-3 w-full text-center text-[0.65rem] tracking-[0.14em] text-bone-dim uppercase underline"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
