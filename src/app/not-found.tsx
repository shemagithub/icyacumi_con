import Link from "next/link";
import { Container } from "@/components/container";
import { site } from "@/lib/site";

export default function NotFound() {
  return (
    <Container className="py-32 text-center">
      <p className="eyebrow">404</p>
      <h1 className="font-display mt-3 text-5xl tracking-[0.03em] lg:text-7xl">
        Off the map
      </h1>
      <p className="mx-auto mt-6 max-w-md text-base leading-relaxed text-bone-dim">
        This page doesn&rsquo;t exist. {site.positioning}
      </p>
      <Link
        href="/shop"
        className="mt-10 craft-btn inline-block bg-rust px-8 py-4 text-xs tracking-[0.2em] text-bone uppercase transition-colors hover:bg-sand"
      >
        Back to the shop
      </Link>
    </Container>
  );
}
