import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/container";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Art",
  description: `Visual culture behind ${site.name} · marks, geometry, and craft as contemporary streetwear language.`,
};

const PILLARS = [
  {
    title: "Marks that mean",
    body: "Every drop starts as visual culture · mask geometry, paint, and symbols that hold weight beyond decoration.",
  },
  {
    title: "Surface as craft",
    body: "Hand-dyed panels, raw hems, Imigongo rhythm. Texture is the artwork you wear.",
  },
  {
    title: "Editorial eye",
    body: "Lookbooks are not afterthoughts. They are how we test silhouette against place, light, and attitude.",
  },
] as const;

export default function ArtPage() {
  return (
    <>
      <section className="border-b-2 border-coal">
        <div className="grid lg:grid-cols-2">
          <div className="relative aspect-[4/5] overflow-hidden bg-ash lg:aspect-auto lg:min-h-[70vh]">
            <Image
              src="/editorial/look-04.png"
              alt="ICYACUMI campaign look · dye-panel craft and ceremonial headpiece"
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="flex flex-col justify-center border-t-2 border-coal bg-bone px-6 py-16 sm:px-10 lg:border-t-0 lg:border-l-2 lg:px-16 lg:py-24">
            <p className="eyebrow">{site.name}</p>
            <h1 className="font-display mt-3 text-5xl tracking-[0.03em] lg:text-6xl">
              Art
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-bone-dim">
              Contemporary luxury streetwear built from art first · craftsmanship
              and cultural experimentation as the design language, not a caption.
            </p>
            <Link
              href="/shop"
              className="craft-btn mt-10 inline-flex w-fit bg-rust px-8 py-4 text-xs tracking-[0.2em] text-bone uppercase transition-colors hover:bg-sand"
            >
              Shop the line
            </Link>
          </div>
        </div>
      </section>
      <Container className="py-16 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-3 lg:gap-16">
          {PILLARS.map((item) => (
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

        <div className="mt-20 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              src: "/editorial/look-01.png",
              alt: "Balaclava denim look with branded suitcase",
            },
            {
              src: "/editorial/look-02.png",
              alt: "Oversized dyed set against the van",
            },
            {
              src: "/editorial/look-03.png",
              alt: "Graphic tee and geometric wrap",
            },
          ].map((shot) => (
            <div
              key={shot.src}
              className="craft-frame relative aspect-[3/4] overflow-hidden bg-ash"
            >
              <Image
                src={shot.src}
                alt={shot.alt}
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </Container>
    </>
  );
}
