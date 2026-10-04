import { CultureIcon } from "@/components/culture-icons";
import { Container } from "@/components/container";

/**
 * Storefront route loading · matches craft / Imigongo language
 * (eyebrow, display type, geometric mark) instead of grey skeletons.
 */
export function PageLoading({
  label = "Opening the floor…",
  hint = "Pulling the next drop into place.",
}: {
  label?: string;
  hint?: string;
}) {
  return (
    <Container className="py-16 sm:py-20 lg:py-24">
      <div
        className="craft-panel mx-auto max-w-lg bg-bone/90 px-6 py-12 text-center sm:px-10 sm:py-14"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <span className="sr-only">{label}</span>

        <div className="site-loading-mark mx-auto text-rust" aria-hidden>
          <span className="site-loading-mark__ring" />
          <span className="site-loading-mark__ring site-loading-mark__ring--delay" />
          <CultureIcon name="spiral" className="site-loading-mark__icon h-9 w-9" />
        </div>

        <p className="eyebrow mt-8">ICYACUMI</p>
        <h1 className="font-display mt-3 text-3xl tracking-[0.03em] text-coal sm:text-4xl">
          {label}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-bone-dim">{hint}</p>

        <div
          className="site-loading-bar mx-auto mt-8"
          aria-hidden
        >
          <span />
        </div>
      </div>
    </Container>
  );
}

/**
 * Admin / portal loading · same pace, portal card chrome.
 */
export function PortalPageLoading({
  label = "Loading…",
  hint = "Fetching the latest from the marketplace.",
}: {
  label?: string;
  hint?: string;
}) {
  return (
    <div
      className="portal-card mx-auto max-w-lg px-6 py-12 text-center sm:px-10"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">{label}</span>

      <div
        className="site-loading-mark mx-auto text-[var(--portal-accent)]"
        aria-hidden
      >
        <span className="site-loading-mark__ring" />
        <span className="site-loading-mark__ring site-loading-mark__ring--delay" />
        <CultureIcon name="spiral" className="site-loading-mark__icon h-8 w-8" />
      </div>

      <p className="admin-section-title mt-8 !mb-0 justify-center">Marketplace</p>
      <h1 className="mt-3 text-2xl font-bold tracking-tight text-[var(--portal-ink)]">
        {label}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-[var(--portal-muted)]">
        {hint}
      </p>

      <div className="site-loading-bar site-loading-bar--portal mx-auto mt-8" aria-hidden>
        <span />
      </div>
    </div>
  );
}
