import type { Metadata } from "next";
import { AdSubmitForm } from "@/components/ad-submit-form";
import { AdsBoard } from "@/components/ads-board";
import { Container } from "@/components/container";
import { getAds } from "@/lib/marketplace";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Ads",
  description: `Photo, visual, and video ads on ${site.name}.`,
};

export default async function AdsPage() {
  const ads = await getAds();

  return (
    <>
      <Container className="py-10 lg:py-14">
        <header className="max-w-2xl">
          <p className="eyebrow">Photo · Visual · Video</p>
          <h1 className="font-display mt-2 text-5xl tracking-[0.03em] lg:text-6xl">
            Ads
          </h1>
          <p className="mt-4 text-base text-bone-dim">
            Promote a brand with a still, motion visual, or video · keep it short.
          </p>
        </header>

        <div className="mt-12">
          <AdsBoard seed={ads} />
        </div>
      </Container>
      <Container className="py-14 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div>
            <p className="eyebrow">Post</p>
            <h2 className="font-display mt-2 text-3xl tracking-[0.04em]">
              Run an ad
            </h2>
            <p className="mt-3 max-w-sm text-sm text-bone-dim">
              Brand partners publish from the portal so creatives stay live across
              every device · not a one-browser draft.
            </p>
          </div>
          <div className="craft-panel culture-rise bg-bone/90 p-6 sm:p-8">
            <AdSubmitForm />
          </div>
        </div>
      </Container>
    </>
  );
}
