import { formatPrice } from "@/lib/format";

type PriceSize = "sm" | "md" | "lg";

const SIZE: Record<
  PriceSize,
  { current: string; was: string; stack: string }
> = {
  sm: {
    current: "text-sm font-bold tracking-tight",
    was: "text-xs",
    stack: "gap-1",
  },
  md: {
    current: "text-base font-bold tracking-tight sm:text-lg",
    was: "text-sm",
    stack: "gap-1.5",
  },
  lg: {
    current: "text-2xl font-extrabold tracking-tight sm:text-3xl",
    was: "text-base",
    stack: "gap-2",
  },
};

/** Clear, scannable price · currency code + amount, optional compare-at. */
export function Price({
  amount,
  compareAt,
  currency,
  size = "md",
  className = "",
}: {
  amount: number;
  compareAt?: number;
  currency?: string;
  size?: PriceSize;
  className?: string;
}) {
  const onSale = Boolean(compareAt && compareAt > amount);
  const styles = SIZE[size];

  return (
    <span
      className={`inline-flex flex-wrap items-baseline ${styles.stack} ${className}`}
    >
      <span
        className={`price-tag tabular-nums ${styles.current} ${
          onSale ? "text-rust" : "text-coal"
        }`}
      >
        {formatPrice(amount, currency)}
      </span>
      {onSale && compareAt ? (
        <span
          className={`price-tag-was tabular-nums text-bone-dim line-through ${styles.was}`}
        >
          {formatPrice(compareAt, currency)}
        </span>
      ) : null}
    </span>
  );
}
