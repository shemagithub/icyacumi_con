import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { title?: string };

function Svg({ title, children, className, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      className={className}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

/** Geometric textile / Imigongo band · Shop */
export function IconTextile(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="4" y="4" width="24" height="24" stroke="currentColor" strokeWidth="1.75" />
      <path d="M4 11h24M4 16h24M4 21h24" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M7 11l3-3 3 3 3-3 3 3 3-3 3 3M7 21l3-3 3 3 3-3 3 3 3-3 3 3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Radiating sun · Dust Season */
export function IconSun(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="16" cy="16" r="5" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="16" cy="16" r="2" fill="currentColor" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const x1 = 16 + Math.cos(rad) * 8;
        const y1 = 16 + Math.sin(rad) * 8;
        const x2 = 16 + Math.cos(rad) * 13;
        const y2 = 16 + Math.sin(rad) * 13;
        return (
          <line
            key={deg}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        );
      })}
    </Svg>
  );
}

/** Traditional face mask · Rodeo Nights */
export function IconMask(props: IconProps) {
  return (
    <Svg {...props}>
      <ellipse cx="16" cy="17" rx="9" ry="11" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="12.5" cy="15" r="1.6" fill="currentColor" />
      <circle cx="19.5" cy="15" r="1.6" fill="currentColor" />
      <path d="M16 6v4M13 22h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M10 11c1.5-1 3-1.5 6-1.5s4.5.5 6 1.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** Headwrap profile · About / story */
export function IconHeadwrap(props: IconProps) {
  return (
    <Svg {...props}>
      <path
        d="M10 26c0-6 3-10 6-10s6 4 6 10"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M11 16c0-5 2.5-9 5-9 3.5 0 7 2 8 7-2 1-4 1.5-6 1.5-2.5 0-5-.5-7-1.5z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M12 12h10M13 9.5h8" stroke="currentColor" strokeWidth="1.25" />
      <circle cx="14.5" cy="17.5" r="1" fill="currentColor" />
    </Svg>
  );
}

/** Clay pot / vessel · Bag */
export function IconPot(props: IconProps) {
  return (
    <Svg {...props}>
      <path
        d="M12 8h8l1 3h-10l1-3z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M9 11h14c0 3-1 6-2 10-.5 2-1.5 5-5 5s-4.5-3-5-5c-1-4-2-7-2-10z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M11 16h10M12 20h8" stroke="currentColor" strokeWidth="1.25" />
    </Svg>
  );
}

/** Djembe drum */
export function IconDrum(props: IconProps) {
  return (
    <Svg {...props}>
      <ellipse cx="16" cy="7" rx="8" ry="3" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M8 7v3c0 2 2 4 4 8l1 7h6l1-7c2-4 4-6 4-8V7"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M11 12l2 4M21 12l-2 4M13 18h6" stroke="currentColor" strokeWidth="1.25" />
    </Svg>
  );
}

/** Beaded necklace · Accessories */
export function IconNecklace(props: IconProps) {
  return (
    <Svg {...props}>
      <path
        d="M8 10c2 8 4 14 8 14s6-6 8-14"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => {
        const t = i / 6;
        const x = 8 + t * 16;
        const y = 10 + Math.sin(t * Math.PI) * 12;
        return <circle key={i} cx={x} cy={y} r="1.4" fill="currentColor" />;
      })}
      <path
        d="M16 24l-2.5 4h5L16 24z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Traditional hut */
export function IconHut(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M16 4l12 12H4L16 4z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
      <path d="M8 16v10h16V16" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
      <path d="M14 26v-6h4v6" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16" cy="12" r="1.2" fill="currentColor" />
    </Svg>
  );
}

/** Familiar human profile / account */
export function IconPerson(props: IconProps) {
  return (
    <Svg {...props}>
      <circle
        cx="16"
        cy="11"
        r="4.5"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M7 26c1.8-5.2 5-8 9-8s7.2 2.8 9 8"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

/** Shield / warrior mark · Outerwear */
export function IconShield(props: IconProps) {
  return (
    <Svg {...props}>
      <path
        d="M16 4c6 2 10 4 10 4v8c0 8-6 12-10 14C12 28 6 24 6 16V8s4-2 10-4z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M16 8v16M11 14h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

/** Spiral / ancestral mark · Sizing / guide */
export function IconSpiral(props: IconProps) {
  return (
    <Svg {...props}>
      <path
        d="M16 6c5.5 0 10 4.5 10 10s-4.5 10-10 10S6 21.5 6 16 10.5 6 16 6"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M16 10c3.3 0 6 2.7 6 6s-2.7 6-6 6-6-2.7-6-6 2.7-6 6-6"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M16 14a2 2 0 1 1 0 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

/** Horned ceremonial mask */
export function IconHorns(props: IconProps) {
  return (
    <Svg {...props}>
      <path
        d="M10 8c-2-3-4-4-5-4 1 3 2 6 3 8M22 8c2-3 4-4 5-4-1 3-2 6-3 8"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <ellipse cx="16" cy="18" rx="8" ry="9" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="13" cy="17" r="1.4" fill="currentColor" />
      <circle cx="19" cy="17" r="1.4" fill="currentColor" />
      <path d="M14 22h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

/** Tee / cloth fold · T-shirts */
export function IconCloth(props: IconProps) {
  return (
    <Svg {...props}>
      <path
        d="M11 8l5-3 5 3 4 2-3 2v12H10V12L7 10l4-2z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M12 14h8M12 18h8" stroke="currentColor" strokeWidth="1.25" />
    </Svg>
  );
}

/**
 * Mobile menu · three Imigongo spears: notched grips, mid diamonds, arrow tips.
 */
export function IconMenu(props: IconProps) {
  return (
    <Svg {...props}>
      {/* Top spear */}
      <path d="M3.5 7.5h2.2l1.4 1.4 1.4-1.4H22" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 7.5l5-3v6Z" fill="currentColor" />
      <path d="M12.5 7.5l1.6-1.6 1.6 1.6-1.6 1.6Z" fill="currentColor" />

      {/* Middle spear · slightly longer rhythm */}
      <path d="M3.5 16h2.8l1.5 1.5 1.5-1.5H23.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M23.5 16l5-3v6Z" fill="currentColor" />
      <path d="M13.2 16l1.7-1.7 1.7 1.7-1.7 1.7Z" fill="currentColor" />
      <circle cx="8.2" cy="16" r="1.15" fill="currentColor" />

      {/* Bottom spear */}
      <path d="M3.5 24.5h2.2l1.4-1.4 1.4 1.4H22" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 24.5l5-3v6Z" fill="currentColor" />
      <path d="M12.5 24.5l1.6-1.6 1.6 1.6-1.6 1.6Z" fill="currentColor" />
    </Svg>
  );
}

/**
 * Close menu · crossed longhorn spears with Imigongo diamond hubs.
 */
export function IconMenuClose(props: IconProps) {
  return (
    <Svg {...props}>
      <path
        d="M8 8l16 16M24 8L8 24"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Spear tips */}
      <path d="M8 8l3.6 0.6L9.2 11.2Z" fill="currentColor" />
      <path d="M24 8l-3.6 0.6L22.8 11.2Z" fill="currentColor" />
      <path d="M8 24l3.6-0.6L9.2 20.8Z" fill="currentColor" />
      <path d="M24 24l-3.6-0.6L22.8 20.8Z" fill="currentColor" />
      {/* Center Imigongo diamond */}
      <path d="M16 12.2l3.8 3.8-3.8 3.8-3.8-3.8Z" fill="currentColor" />
      <path d="M16 14.1l1.9 1.9-1.9 1.9-1.9-1.9Z" fill="var(--color-bone, #f5f0e8)" />
    </Svg>
  );
}

/** Magnifying glass · site search */
export function IconSearch(props: IconProps) {
  return (
    <Svg {...props}>
      <circle
        cx="14"
        cy="14"
        r="7.5"
        stroke="currentColor"
        strokeWidth="2.25"
      />
      <path
        d="M19.5 19.5L26 26"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M14 10.5l2.2 2.2-2.2 2.2-2.2-2.2Z"
        fill="currentColor"
        opacity="0.85"
      />
    </Svg>
  );
}

export const cultureIcons = {
  textile: IconTextile,
  sun: IconSun,
  mask: IconMask,
  headwrap: IconHeadwrap,
  pot: IconPot,
  drum: IconDrum,
  necklace: IconNecklace,
  hut: IconHut,
  person: IconPerson,
  shield: IconShield,
  spiral: IconSpiral,
  horns: IconHorns,
  cloth: IconCloth,
  menu: IconMenu,
  menuClose: IconMenuClose,
  search: IconSearch,
} as const;

export type CultureIconName = keyof typeof cultureIcons;

export function CultureIcon({
  name,
  className = "h-5 w-5",
  ...props
}: { name: CultureIconName } & IconProps) {
  const Icon = cultureIcons[name];
  return <Icon className={className} {...props} />;
}
