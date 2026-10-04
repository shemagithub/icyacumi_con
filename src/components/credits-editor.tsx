"use client";

import { CREDIT_ROLES } from "@/lib/credits";
import type { Credit } from "@/lib/types";

export function CreditsEditor({
  value,
  onChange,
}: {
  value: Credit[];
  onChange: (credits: Credit[]) => void;
}) {
  function update(index: number, patch: Partial<Credit>) {
    onChange(value.map((credit, i) => (i === index ? { ...credit, ...patch } : credit)));
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs font-semibold tracking-[0.1em] text-[var(--portal-muted)] uppercase">
            Credits / shout-outs
          </p>
          <p className="mt-1 text-xs text-[var(--portal-muted)]">
            Name who worked the piece · photographer, tailor, DJ, or a shout-out.
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            onChange(
              [...value, { role: "Shout-out", name: "", url: "" }].slice(0, 12),
            )
          }
          className="portal-btn portal-btn--ghost !py-1.5 !text-xs"
        >
          + Add credit
        </button>
      </div>

      {value.length === 0 ? (
        <p className="text-xs text-[var(--portal-muted)]">
          No credits yet. Add someone who made this happen.
        </p>
      ) : (
        <div className="space-y-2">
          {value.map((credit, index) => (
            <div
              key={index}
              className="grid gap-2 sm:grid-cols-[8.5rem_1fr_1fr_auto]"
            >
              <select
                value={
                  CREDIT_ROLES.includes(credit.role as (typeof CREDIT_ROLES)[number])
                    ? credit.role
                    : "Shout-out"
                }
                onChange={(event) => update(index, { role: event.target.value })}
                className="portal-input appearance-none"
                aria-label={`Credit ${index + 1} role`}
              >
                {CREDIT_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
              <input
                value={credit.name}
                onChange={(event) => update(index, { name: event.target.value })}
                className="portal-input"
                placeholder="Name"
                aria-label={`Credit ${index + 1} name`}
              />
              <input
                value={credit.url ?? ""}
                onChange={(event) => update(index, { url: event.target.value })}
                className="portal-input"
                placeholder="Link (optional)"
                aria-label={`Credit ${index + 1} link`}
              />
              <button
                type="button"
                onClick={() => onChange(value.filter((_, i) => i !== index))}
                className="portal-btn portal-btn--ghost !py-2 !text-xs text-[var(--portal-accent)]"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
