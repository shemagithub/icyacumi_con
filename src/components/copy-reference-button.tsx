"use client";

import { useState } from "react";

/** One-click copy for order references on success / track pages. */
export function CopyReferenceButton({
  value,
  label = "Copy reference",
}: {
  value: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void onCopy()}
      className="text-xs tracking-[0.14em] text-bone-dim uppercase underline underline-offset-4 hover:text-rust"
    >
      {copied ? "Copied" : label}
    </button>
  );
}
