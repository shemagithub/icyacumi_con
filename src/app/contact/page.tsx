"use client";

import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/container";
import { ContactForm } from "@/components/contact-form";
import { CultureIcon } from "@/components/culture-icons";
import { SocialIcons } from "@/components/social-icons";
import { useSiteSettings } from "@/components/site-settings-provider";

export default function ContactPage() {
  const site = useSiteSettings();

  return (
    <>
      <section className="border-b-2 border-coal">
        <div className="grid lg:grid-cols-2">
          <div className="relative aspect-[3/4] max-h-[42vh] overflow-hidden bg-ash sm:aspect-[4/5] sm:max-h-none lg:aspect-auto lg:min-h-[72vh]">
            <Image
              src="/editorial/look-01.png"
              alt={`${site.companyName} campaign · where past meets future`}
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-coal/55 via-transparent to-transparent" />
            <p className="absolute right-5 bottom-5 left-5 text-[0.65rem] tracking-[0.2em] text-bone uppercase sm:right-8 sm:bottom-8 sm:left-8">
              {site.tagline}
            </p>
          </div>

          <div className="flex flex-col justify-center border-t-2 border-coal bg-bone px-6 py-14 sm:px-10 lg:border-t-0 lg:border-l-2 lg:px-14 lg:py-20 xl:px-16">
            <p className="eyebrow">{site.madeIn}</p>
            <h1 className="font-display mt-3 text-5xl tracking-[0.03em] lg:text-6xl">
              Contact
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-bone-dim">
              Orders, fit questions, press, or a collaboration idea · send a note.
              We answer like we design: with care, not noise.
            </p>

            <ul className="mt-10 space-y-5 border-t-2 border-coal pt-8">
              <li>
                <a
                  href={`mailto:${site.email}`}
                  className="group flex items-start gap-3 transition-colors"
                >
                  <CultureIcon
                    name="spiral"
                    className="mt-0.5 h-5 w-5 shrink-0 text-rust transition-colors group-hover:text-indigo"
                  />
                  <span>
                    <span className="eyebrow block">Email</span>
                    <span className="mt-1 block text-sm text-coal group-hover:text-rust">
                      {site.email}
                    </span>
                  </span>
                </a>
              </li>
              {site.phone ? (
                <li>
                  <a
                    href={`tel:${site.phone.replace(/\s+/g, "")}`}
                    className="group flex items-start gap-3 transition-colors"
                  >
                    <CultureIcon
                      name="drum"
                      className="mt-0.5 h-5 w-5 shrink-0 text-rust transition-colors group-hover:text-indigo"
                    />
                    <span>
                      <span className="eyebrow block">Phone</span>
                      <span className="mt-1 block text-sm text-coal group-hover:text-rust">
                        {site.phone}
                      </span>
                    </span>
                  </a>
                </li>
              ) : null}
              <li>
                <Link
                  href="/sizing"
                  className="group flex items-start gap-3 transition-colors"
                >
                  <CultureIcon
                    name="cloth"
                    className="mt-0.5 h-5 w-5 shrink-0 text-rust transition-colors group-hover:text-indigo"
                  />
                  <span>
                    <span className="eyebrow block">Before you write</span>
                    <span className="mt-1 block text-sm text-coal group-hover:text-rust">
                      Check the size guide
                    </span>
                  </span>
                </Link>
              </li>
            </ul>

            {site.social.length ? (
              <div className="mt-8">
                <p className="eyebrow mb-3">Social</p>
                <SocialIcons links={site.social} size="md" />
              </div>
            ) : null}
          </div>
        </div>
      </section>
      <Container className="py-16 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 xl:gap-24">
          <div>
            <p className="eyebrow">Write us</p>
            <h2 className="font-display mt-3 text-3xl tracking-[0.04em] lg:text-4xl">
              Drop a line
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-bone-dim">
              Prefer mail over forms?{" "}
              <a
                href={`mailto:${site.email}`}
                className="text-coal underline decoration-rust/50 underline-offset-4 transition-colors hover:text-rust"
              >
                {site.email}
              </a>
            </p>

            <div className="craft-panel mt-10 hidden bg-ash/40 p-6 lg:block">
              <p className="font-display text-lg tracking-[0.06em]">Hours</p>
              <p className="mt-3 text-sm leading-relaxed text-bone-dim">
                Studio replies Mon-Fri. Weekend notes land in the Monday stack.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-bone-dim">
                {site.positioning}
              </p>
            </div>
          </div>

          <div className="craft-panel culture-rise bg-bone/90 p-6 sm:p-8 lg:p-10">
            <ContactForm />
          </div>
        </div>
      </Container>
    </>
  );
}
