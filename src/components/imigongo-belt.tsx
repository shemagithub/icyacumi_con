/**
 * Full-bleed Imigongo belt · section breaker using the real pattern.
 */
export function ImigongoBelt({
  tone = "ink",
  size = "md",
}: {
  tone?: "ink" | "cream" | "rust" | "indigo";
  size?: "sm" | "md" | "lg";
}) {
  const height =
    size === "sm" ? "h-8 sm:h-10" : size === "lg" ? "h-16 sm:h-24" : "h-12 sm:h-16";

  return (
    <div
      className={`imigongo-belt imigongo-belt--${tone} ${height} w-full`}
      role="presentation"
      aria-hidden
    />
  );
}
