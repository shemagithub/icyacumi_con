"use client";

import Link from "next/link";

export function TermsAcceptCheckbox({
  checked,
  onChange,
  id = "accept-terms",
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  id?: string;
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start gap-3 rounded-xl border border-ash-line bg-ash/30 px-4 py-3 text-sm leading-relaxed text-coal"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-rust)]"
        required
      />
      <span>
        I agree to the{" "}
        <Link
          href="/terms"
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-rust underline underline-offset-4"
        >
          Terms &amp; Conditions
        </Link>{" "}
        and{" "}
        <Link
          href="/privacy"
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-rust underline underline-offset-4"
        >
          Privacy Policy
        </Link>
        .
      </span>
    </label>
  );
}
