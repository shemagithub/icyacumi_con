import Link from "next/link";
import { CultureIcon, type CultureIconName } from "@/components/culture-icons";

const PATHS: {
  href: string;
  label: string;
  hint: string;
  icon: CultureIconName;
  accent: string;
}[] = [
  {
    href: "/shop",
    label: "Shop",
    hint: "Season drops & brand floors",
    icon: "cloth",
    accent: "from-rust/15 to-transparent",
  },
  {
    href: "/brands",
    label: "Brands",
    hint: "Makers across AFREEKA",
    icon: "necklace",
    accent: "from-indigo/15 to-transparent",
  },
  {
    href: "/events",
    label: "Events",
    hint: "Tickets + shop the floor",
    icon: "drum",
    accent: "from-paint-yellow/25 to-transparent",
  },
  {
    href: "/ads",
    label: "Ads",
    hint: "Photo, visual, video",
    icon: "mask",
    accent: "from-sand/20 to-transparent",
  },
];

/** Big purpose tiles · get people where they want in one tap. */
export function QuickPaths() {
  return (
    <section className="quick-paths">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Start here</p>
          <h2 className="font-display mt-2 text-3xl tracking-[0.03em] lg:text-4xl">
            What do you want?
          </h2>
        </div>
        <Link
          href="/track"
          className="text-xs tracking-[0.16em] text-bone-dim uppercase underline underline-offset-4 hover:text-rust"
        >
          Track an order
        </Link>
      </div>

      <ul className="culture-stagger mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {PATHS.map((path) => (
          <li key={path.href}>
            <Link
              href={path.href}
              className={`path-tile craft-panel group relative flex h-full flex-col overflow-hidden bg-bone/95 p-5 sm:p-6`}
            >
              <span
                className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${path.accent} opacity-80 transition-opacity group-hover:opacity-100`}
                aria-hidden
              />
              <CultureIcon
                name={path.icon}
                className="relative h-7 w-7 text-rust transition-transform duration-300 group-hover:scale-110"
              />
              <span className="font-display relative mt-4 text-2xl tracking-[0.04em] sm:text-3xl">
                {path.label}
              </span>
              <span className="relative mt-2 text-sm leading-snug text-bone-dim">
                {path.hint}
              </span>
              <span className="relative mt-5 inline-flex items-center gap-2 text-[0.65rem] font-bold tracking-[0.18em] text-rust uppercase">
                Open
                <span
                  aria-hidden
                  className="inline-block transition-transform duration-300 group-hover:translate-x-1"
                >
                  →
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
