import Image from "next/image";
import Link from "next/link";
import { CultureIcon } from "@/components/culture-icons";
import { CreditsList } from "@/components/credits-list";
import type { AdCreative } from "@/lib/types";

export function AdsBoard({ seed }: { seed: AdCreative[] }) {
  if (seed.length === 0) {
    return (
      <p className="text-sm text-bone-dim">
        No live ads yet. Brands publish from the portal.
      </p>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {seed.map((ad) => (
        <article key={ad.id} className="craft-panel culture-rise overflow-hidden bg-bone/90">
          <div className="craft-frame craft-frame--soft relative aspect-[4/5] overflow-hidden bg-ash">
            <Image
              src={ad.media.src}
              alt={ad.media.alt}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover"
            />
            <span className="absolute top-3 left-3 bg-paint-yellow px-2.5 py-1 text-[0.625rem] tracking-[0.16em] text-coal uppercase">
              {ad.type}
            </span>
          </div>
          <div className="p-5">
            <p className="eyebrow">{ad.brand}</p>
            <h2 className="font-display mt-2 text-2xl tracking-[0.04em]">{ad.title}</h2>
            <p className="mt-2 text-sm text-bone-dim">{ad.summary}</p>
            <CreditsList credits={ad.credits} title="Credits" compact />
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link
                href={ad.ctaHref}
                className="craft-btn bg-rust px-4 py-2.5 text-[0.65rem] tracking-[0.16em] text-bone uppercase"
              >
                {ad.ctaLabel}
              </Link>
              {ad.mediaUrl ? (
                <a
                  href={ad.mediaUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1.5 text-xs tracking-[0.14em] text-bone-dim uppercase underline underline-offset-4 hover:text-rust"
                >
                  <CultureIcon name="spiral" className="h-3.5 w-3.5 text-rust" />
                  Open media
                </a>
              ) : null}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
