import type { Credit } from "@/lib/types";

export function CreditsList({
  credits,
  title = "Credits",
  compact = false,
}: {
  credits?: Credit[];
  title?: string;
  compact?: boolean;
}) {
  if (!credits?.length) return null;

  return (
    <section className={compact ? "mt-4" : "mt-8 border-t border-ash-line pt-6"}>
      <p className="eyebrow">{title}</p>
      {compact ? null : (
        <p className="mt-1 text-sm text-bone-dim">
          People who worked this piece · shout-out from the brand.
        </p>
      )}
      <ul className={compact ? "mt-2 space-y-1.5" : "mt-4 space-y-2.5"}>
        {credits.map((credit, index) => {
          const key = `${credit.role}-${credit.name}-${index}`;
          const name = credit.url ? (
            <a
              href={credit.url}
              target="_blank"
              rel="noreferrer noopener"
              className="font-semibold text-rust underline-offset-2 hover:underline"
            >
              {credit.name}
            </a>
          ) : (
            <span className="font-semibold text-coal">{credit.name}</span>
          );

          return (
            <li key={key} className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-[0.65rem] font-bold tracking-[0.14em] text-bone-dim uppercase">
                {credit.role}
              </span>
              {name}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
