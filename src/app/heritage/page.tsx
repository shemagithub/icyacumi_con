import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { Container } from "@/components/container";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Heritage",
  description: `${site.madeIn} · African craft languages meeting modern streetwear at ${site.name}.`,
};

export default function HeritagePage() {
  return (
    <>
      <Container className="py-16 lg:py-24">
        <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="eyebrow">{site.madeIn}</p>
            <h1 className="font-display mt-3 text-5xl tracking-[0.03em] lg:text-6xl">
              Heritage
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-bone-dim lg:text-xl">
              {site.positioning}
            </p>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-bone-dim">
              {site.name} designs from African craft languages and modern cultural
              experimentation · Imigongo geometry, ceremonial marks, hand-finished
              surfaces. Not costume. Not nostalgia. A way of seeing.
            </p>
          </div>
          <BrandLogo size="lg" />
        </div>
      </Container>

      <div className="relative aspect-[21/9] overflow-hidden border-y-2 border-coal bg-ash">
        <Image
          src="/editorial/look-03.png"
          alt="BONE KOBOYI look · graphic tee and patterned wrap"
          fill
          sizes="100vw"
          className="object-cover object-[center_20%]"
          priority
        />
      </div>
      <Container className="py-16 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-3 lg:gap-16">
          {[
            {
              title: "Rooted",
              body: "Motifs and materials drawn from living craft traditions · geometry, dye, textile logic · carried into city wear.",
            },
            {
              title: "Made with intent",
              body: "Small runs, heavy fabrics, finishes you can feel. Luxury streetwear built for lasting presence, not volume.",
            },
            {
              title: "Where past meets future",
              body: "Heritage is the spine. Experimentation is the cut. Together they define the BONE KOBOYI silhouette.",
            },
          ].map((item) => (
            <div key={item.title}>
              <h2 className="font-display text-2xl tracking-[0.05em]">
                {item.title}
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-bone-dim">
                {item.body}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-20 border-t border-ash-line pt-12">
          <p className="eyebrow">Continue</p>
          <h2 className="font-display mt-3 text-4xl tracking-[0.03em]">
            Wear the lineage
          </h2>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/shop"
              className="craft-btn inline-block bg-rust px-8 py-4 text-xs tracking-[0.2em] text-bone uppercase transition-colors hover:bg-sand"
            >
              Clothing
            </Link>
            <Link
              href="/art"
              className="craft-btn-ghost inline-block bg-bone px-8 py-4 text-xs tracking-[0.2em] text-coal uppercase transition-colors hover:text-rust"
            >
              Art
            </Link>
            <Link
              href="/about"
              className="craft-btn-ghost inline-block bg-bone px-8 py-4 text-xs tracking-[0.2em] text-coal uppercase transition-colors hover:text-rust"
            >
              Full story
            </Link>
          </div>
        </div>
      </Container>
    </>
  );
}
