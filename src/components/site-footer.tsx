"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { Container } from "@/components/container";
import { CultureIcon, type CultureIconName } from "@/components/culture-icons";
import { NewsletterForm } from "@/components/newsletter-form";
import { SocialIcons } from "@/components/social-icons";
import { useSiteSettings } from "@/components/site-settings-provider";
import { loginHref } from "@/lib/auth-redirect";
import { site } from "@/lib/site";

export function SiteFooter() {
  const pathname = usePathname();
  const live = useSiteSettings();
  if (pathname.startsWith("/portal") || pathname.startsWith("/admin")) return null;

  const helpLinks = site.footer.help.map((item) =>
    item.href === "/login" ? { ...item, href: loginHref(pathname) } : item,
  );

  const socials = live.social;

  return (
    <footer className="mt-24 border-t-2 border-coal bg-coal-soft">
      <Container className="py-12 sm:py-16 lg:py-20">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:gap-y-12 lg:grid-cols-[1.4fr_1fr_1fr] lg:gap-12">
          <div className="col-span-2 lg:col-span-1">
            <BrandLogo size="md" />
            <p className="mt-2 text-[0.65rem] tracking-[0.16em] text-rust uppercase">
              {live.madeIn}
            </p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-bone-dim">
              {live.tagline}
            </p>
            <ul className="mt-4 space-y-1.5 text-sm text-bone-dim">
              <li>
                <a
                  href={`mailto:${live.email}`}
                  className="transition-colors hover:text-rust"
                >
                  {live.email}
                </a>
              </li>
              {live.phone ? (
                <li>
                  <a
                    href={`tel:${live.phone.replace(/\s+/g, "")}`}
                    className="transition-colors hover:text-rust"
                  >
                    {live.phone}
                  </a>
                </li>
              ) : null}
            </ul>
            {socials.length ? (
              <div className="mt-6">
                <p className="mb-3 text-[0.65rem] tracking-[0.16em] text-coal uppercase">
                  Follow
                </p>
                <SocialIcons links={socials} size="md" />
              </div>
            ) : null}
            <div className="mt-8 max-w-xs">
              <p className="text-[0.65rem] tracking-[0.16em] text-coal uppercase">
                Subscribe
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-bone-dim">
                Drops, markets, and floor news · no spam.
              </p>
              <NewsletterForm
                source="footer"
                inputId="footer-newsletter-email"
                className="mt-3"
              />
            </div>
          </div>

          <FooterColumn title="Explore" links={site.footer.shop} />
          <FooterColumn title="Help" links={helpLinks} />
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-ash-line pt-8 text-xs text-bone-dim sm:mt-16 sm:flex-row sm:items-center sm:justify-between">
          <p suppressHydrationWarning>
            &copy; {new Date().getFullYear()} {live.companyName}
          </p>
          {socials.length ? <SocialIcons links={socials} size="sm" /> : null}
          <p className="inline-flex items-center gap-2 tracking-[0.18em] uppercase">
            <CultureIcon name="headwrap" className="h-4.5 w-4.5 text-rust" />
            {live.madeIn}
          </p>
        </div>
      </Container>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links:
    | readonly { href: string; label: string; icon: CultureIconName }[]
    | { href: string; label: string; icon: CultureIconName }[];
}) {
  return (
    <div>
      <p className="eyebrow mb-4">{title}</p>
      <ul className="space-y-3">
        {links.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="inline-flex items-center gap-2 text-sm text-bone-dim transition-colors hover:text-rust"
            >
              <CultureIcon
                name={item.icon}
                className="h-4 w-4 shrink-0 text-rust/80"
              />
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
