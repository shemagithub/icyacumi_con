import Link from "next/link";
import { CultureIcon } from "@/components/culture-icons";
import type { CraftPassportData } from "@/lib/craft-passport";
import { site } from "@/lib/site";

export function CraftPassport({ data }: { data: CraftPassportData }) {
  return (
    <aside className="mt-8 overflow-hidden rounded-xl border border-ash-line bg-ash/30">
      <div className="flex items-center justify-between gap-3 border-b border-ash-line px-5 py-3">
        <div className="flex items-center gap-2">
          <CultureIcon name="mask" className="h-4 w-4 text-rust" />
          <p className="text-[0.65rem] font-semibold tracking-[0.16em] text-coal uppercase">
            Craft passport
          </p>
        </div>
        <p className="text-[0.6rem] tracking-[0.14em] text-bone-dim uppercase">
          {site.madeIn}
        </p>
      </div>

      <dl className="grid gap-px bg-ash-line sm:grid-cols-2">
        {[
          { label: "Origin", value: data.origin },
          { label: "Season drop", value: data.season },
          { label: "Cloth", value: data.fabric },
          { label: "Fit", value: data.fit },
        ].map((row) => (
          <div key={row.label} className="bg-bone/90 px-5 py-3.5">
            <dt className="text-[0.6rem] font-semibold tracking-[0.16em] text-bone-dim uppercase">
              {row.label}
            </dt>
            <dd className="mt-1 text-sm text-coal">{row.value}</dd>
          </div>
        ))}
      </dl>

      <div className="space-y-3 border-t border-ash-line px-5 py-4">
        <div>
          <p className="text-[0.6rem] font-semibold tracking-[0.16em] text-bone-dim uppercase">
            Motif
          </p>
          <p className="mt-1 font-display text-lg tracking-[0.04em] text-coal">
            {data.motif}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-bone-dim">
            {data.motifNote}
          </p>
        </div>
        <p className="text-sm leading-relaxed text-bone-dim">{data.makerLine}</p>
        <p className="text-sm text-bone-dim">{data.seasonLine}</p>
        <div className="flex flex-wrap gap-4 pt-1">
          <Link
            href={`/shop?collection=${data.seasonSlug}`}
            className="text-xs tracking-[0.14em] text-rust uppercase underline underline-offset-4 hover:text-coal"
          >
            Shop {data.season}
          </Link>
          <Link
            href="/heritage"
            className="text-xs tracking-[0.14em] text-bone-dim uppercase underline underline-offset-4 hover:text-rust"
          >
            Read heritage
          </Link>
          <Link
            href={data.brandHref}
            className="text-xs tracking-[0.14em] text-bone-dim uppercase underline underline-offset-4 hover:text-rust"
          >
            {data.brandName}
          </Link>
        </div>
      </div>
    </aside>
  );
}
