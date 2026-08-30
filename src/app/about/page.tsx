"use client";

import Image from "next/image";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { Container } from "@/components/container";
import { SocialIcons } from "@/components/social-icons";
import { useSiteSettings } from "@/components/site-settings-provider";

export default function AboutPage() {
  const site = useSiteSettings();
  const heroSrc = site.aboutHeroImageUrl || "/scenes/editorial-ranch.jpg";
  const heroIsData = heroSrc.startsWith("data:");
  const logoIsData = site.logoUrl.startsWith("data:");

  const pillars = [
    { title: site.pillarArtTitle, body: site.pillarArtBody },
    { title: site.pillarCraftTitle, body: site.pillarCraftBody },
    { title: site.pillarCultureTitle, body: site.pillarCultureBody },
  ];

  return (
    <>
      <Container className="py-16 lg:py-24">
        <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="eyebrow">{site.madeIn}</p>
            <div className="mt-4">
              <BrandLogo size="hero" />
            </div>
            <p className="mt-6 text-lg leading-relaxed text-bone-dim lg:text-xl">
              {site.positioning}
            </p>
            <p className="mt-4 max-w-2xl whitespace-pre-wrap text-base leading-relaxed text-bone-dim">
              {site.aboutBody}
            </p>
            {site.social.length ? (
              <div className="mt-8">
                <p className="eyebrow mb-3">Follow {site.shortName}</p>
                <SocialIcons links={site.social} size="lg" />
              </div>
            ) : null}
          </div>
          {logoIsData ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={site.logoUrl}
              alt={site.logoAlt}
              width={120}
              height={128}
              className="craft-frame--soft shrink-0 object-contain"
            />
          ) : (
            <Image
              src={site.logoUrl}
              alt={site.logoAlt}
              width={120}
              height={128}
              className="craft-frame--soft shrink-0 object-contain"
              priority
            />
          )}
        </div>
      </Container>

      <div className="relative aspect-[3/1] max-h-[280px] overflow-hidden border-y-2 border-coal bg-ash sm:max-h-[340px] lg:aspect-[21/8] lg:max-h-[380px]">
        {heroIsData ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroSrc}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <Image
            src={heroSrc}
            alt="Open ground under a low sun"
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
        )}
      </div>

      <Container className="py-16 lg:py-24">
        <p className="mb-10 max-w-2xl text-sm leading-relaxed text-bone-dim">
          {site.positioning}
        </p>
        <div className="grid gap-12 lg:grid-cols-3 lg:gap-16">
          {pillars.map((item) => (
            <div key={item.title}>
              <h2 className="font-display text-2xl tracking-[0.05em]">{item.title}</h2>
              <p className="mt-4 text-sm leading-relaxed text-bone-dim">{item.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-20 grid gap-10 border-t border-ash-line pt-12 lg:grid-cols-[1.2fr_1fr] lg:items-end">
          <div>
            <p className="eyebrow">Ready?</p>
            <h2 className="font-display mt-3 text-4xl tracking-[0.03em]">
              See what&rsquo;s in stock
            </h2>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/shop"
                className="craft-btn inline-block bg-rust px-8 py-4 text-xs tracking-[0.2em] text-bone uppercase transition-colors hover:bg-sand"
              >
                Shop the line
              </Link>
              <Link
                href="/contact"
                className="craft-btn inline-block border-2 border-coal bg-transparent px-8 py-4 text-xs tracking-[0.2em] text-coal uppercase transition-colors hover:border-rust hover:text-rust"
              >
                Contact us
              </Link>
            </div>
          </div>
          {site.social.length ? (
            <div>
              <p className="eyebrow mb-3">Social</p>
              <SocialIcons links={site.social} size="md" tone="solid" />
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-bone-dim">
                Follow {site.companyName} for drops, markets, and studio news.
              </p>
            </div>
          ) : null}
        </div>
      </Container>
    </>
  );
}
