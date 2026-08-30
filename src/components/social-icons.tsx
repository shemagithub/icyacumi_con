import type { SVGProps } from "react";

export type SocialLink = {
  href: string;
  label: string;
};

type IconProps = SVGProps<SVGSVGElement>;

function normalizeHref(href: string) {
  const value = href.trim();
  if (!value) return "#";
  if (value.startsWith("http") || value.startsWith("mailto:") || value.startsWith("/")) {
    return value;
  }
  if (value.startsWith("@")) {
    return `https://instagram.com/${value.slice(1)}`;
  }
  return `https://${value}`;
}

function networkKey(label: string, href: string) {
  const hay = `${label} ${href}`.toLowerCase();
  if (hay.includes("instagram")) return "instagram";
  if (hay.includes("tiktok")) return "tiktok";
  if (hay.includes("facebook") || hay.includes("fb.com")) return "facebook";
  if (hay.includes("youtube") || hay.includes("youtu.be")) return "youtube";
  if (hay.includes("twitter") || hay.includes("x.com") || /(^|\s)x(\s|$)/i.test(label)) {
    return "twitter";
  }
  if (hay.includes("website") || hay.includes("http")) return "website";
  return "website";
}

function IconInstagram(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
    </svg>
  );
}

function IconTikTok(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <path
        d="M14 4v9.2a3.8 3.8 0 1 1-2.6-3.6V7.2c.9.2 1.8.6 2.6 1.1V4Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M14 7.2c1.2 1.4 2.7 2.3 4.5 2.5V12c-1.7-.1-3.3-.8-4.5-1.9"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconFacebook(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <path
        d="M14.5 8.5H16V5.8c-.3 0-1.3-.2-2.5-.2-2.5 0-4.2 1.5-4.2 4.3V12H7v3h2.3v7h3.4v-7H15l.5-3h-2.8V10c0-.9.3-1.5 1.8-1.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconTwitter(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <path
        d="M6 5.5h3.1l3.1 4.4L15.9 5.5H19l-5.1 6.3L19.3 18.5h-3.1l-3.5-4.9-4 4.9H5.5l5.5-6.6L6 5.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconYouTube(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <rect x="3" y="6.5" width="18" height="11" rx="3" stroke="currentColor" strokeWidth="1.75" />
      <path d="M11 10.2v3.6l3.4-1.8-3.4-1.8Z" fill="currentColor" />
    </svg>
  );
}

function IconWebsite(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <circle cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth="1.75" />
      <path d="M4 12h16M12 4a14 14 0 0 1 0 16M12 4a14 14 0 0 0 0 16" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

const ICONS = {
  instagram: IconInstagram,
  tiktok: IconTikTok,
  facebook: IconFacebook,
  twitter: IconTwitter,
  youtube: IconYouTube,
  website: IconWebsite,
} as const;

export function SocialIcons({
  links,
  className = "",
  size = "md",
  tone = "default",
}: {
  links: readonly SocialLink[];
  className?: string;
  size?: "sm" | "md" | "lg";
  tone?: "default" | "onDark" | "solid";
}) {
  const items = links.filter((item) => item.href?.trim());
  if (!items.length) return null;

  const box = {
    sm: "h-9 w-9",
    md: "h-10 w-10",
    lg: "h-11 w-11",
  }[size];

  const glyph = {
    sm: "h-4 w-4",
    md: "h-[1.15rem] w-[1.15rem]",
    lg: "h-5 w-5",
  }[size];

  const toneClass =
    tone === "solid"
      ? "border-coal bg-coal text-bone hover:bg-rust hover:border-rust"
      : tone === "onDark"
        ? "border-ash-line/70 bg-transparent text-bone-dim hover:border-rust hover:text-rust"
        : "border-ash-line bg-bone text-coal hover:border-rust hover:text-rust";

  return (
    <ul className={`flex flex-wrap items-center gap-2.5 ${className}`}>
      {items.map((item) => {
        const key = networkKey(item.label, item.href);
        const Icon = ICONS[key] ?? ICONS.website;
        return (
          <li key={`${item.label}-${item.href}`}>
            <a
              href={normalizeHref(item.href)}
              target="_blank"
              rel="noreferrer noopener"
              aria-label={item.label}
              title={item.label}
              className={`inline-flex ${box} items-center justify-center border-2 transition-colors ${toneClass}`}
            >
              <Icon className={glyph} />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
