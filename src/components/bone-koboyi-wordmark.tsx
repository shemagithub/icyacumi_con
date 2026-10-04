/**
 * ICYACUMI wordmark in the brand's tribal-geometric letter style
 * (gold / ink / maroon), matching the custom alphabet sheet.
 */

const GOLD = "#d4a017";
const INK = "#1a1410";
const MAROON = "#7a1f2b";

type LetterProps = { x: number; color?: string; strokeWidth: number };

function LetterB({ x, color = GOLD, strokeWidth }: LetterProps) {
  return (
    <g
      transform={`translate(${x} 0)`}
      stroke={color}
      fill="none"
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
    >
      <line x1="2" y1="2" x2="2" y2="26" />
      <path d="M2 4 L12 8 L2 12 Z" />
      <path d="M2 14 L12 18 L2 22 Z" />
      <circle cx="6.5" cy="8" r="1.25" fill={color} stroke="none" />
      <circle cx="6.5" cy="18" r="1.25" fill={color} stroke="none" />
    </g>
  );
}

function LetterO({ x, color = GOLD, strokeWidth }: LetterProps) {
  return (
    <g
      transform={`translate(${x} 0)`}
      stroke={color}
      fill="none"
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
    >
      <path d="M8 2 L14 14 L8 26 L2 14 Z" />
      <path d="M8 8 L8 20" />
      <path d="M8 8 L5.5 12 M8 8 L10.5 12" />
      <circle cx="8" cy="21.5" r="1.15" fill={color} stroke="none" />
    </g>
  );
}

function LetterN({ x, color = INK, strokeWidth }: LetterProps) {
  return (
    <g
      transform={`translate(${x} 0)`}
      stroke={color}
      fill="none"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    >
      <path d="M2 26 L2 4 L14 26 L14 4" />
      <line x1="5" y1="12" x2="9" y2="16" />
      <circle cx="11" cy="8" r="1.15" fill={color} stroke="none" />
    </g>
  );
}

function LetterE({ x, color = INK, strokeWidth }: LetterProps) {
  return (
    <g
      transform={`translate(${x} 0)`}
      stroke={color}
      fill="none"
      strokeWidth={strokeWidth}
      strokeLinecap="square"
    >
      <line x1="2" y1="2" x2="2" y2="26" />
      <path d="M2 4 H12 V6.4 H2" />
      <path d="M2 13 H11 V15.4 H2" />
      <path d="M2 22 H12 V24.4 H2" />
      <circle cx="7" cy="9.5" r="1.05" fill={color} stroke="none" />
      <circle cx="7" cy="18.5" r="1.05" fill={color} stroke="none" />
    </g>
  );
}

function LetterK({ x, color = GOLD, strokeWidth }: LetterProps) {
  return (
    <g
      transform={`translate(${x} 0)`}
      stroke={color}
      fill="none"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    >
      <line x1="2" y1="2" x2="2" y2="26" />
      <path d="M2 14 L12 4 M2 14 L12 24" />
      <circle cx="7" cy="14" r="1.25" fill={color} stroke="none" />
    </g>
  );
}

function LetterY({ x, color = GOLD, strokeWidth }: LetterProps) {
  return (
    <g
      transform={`translate(${x} 0)`}
      stroke={color}
      fill="none"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    >
      <path d="M2 4 L8 14 L14 4" />
      <line x1="8" y1="14" x2="8" y2="26" />
      <circle cx="8" cy="17.5" r="1.25" fill={color} stroke="none" />
      <path d="M5.5 20.5 H10.5" />
    </g>
  );
}

function LetterI({ x, color = MAROON, strokeWidth }: LetterProps) {
  return (
    <g
      transform={`translate(${x} 0)`}
      stroke={color}
      fill="none"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    >
      <circle cx="5" cy="3.5" r="1.55" fill={color} stroke="none" />
      <line x1="5" y1="7" x2="5" y2="26" />
      <rect x="5" y="13" width="5.5" height="2.6" fill={color} stroke="none" />
    </g>
  );
}

function Separator({ x, strokeWidth }: { x: number; strokeWidth: number }) {
  return (
    <g
      transform={`translate(${x} 0)`}
      stroke={MAROON}
      fill="none"
      strokeWidth={Math.max(strokeWidth - 0.2, 1.4)}
      strokeLinecap="round"
    >
      <line x1="2" y1="14" x2="14" y2="14" />
      <path d="M4 11 L2 14 L4 17" />
      <path d="M12 11 L14 14 L12 17" />
    </g>
  );
}

export function BoneKoboyiWordmark({
  className = "",
  title = "ICYACUMI",
  bold = false,
}: {
  className?: string;
  title?: string;
  /** Heavier strokes for navbar / small screens */
  bold?: boolean;
}) {
  const strokeWidth = bold ? 2.45 : 1.6;

  return (
    <svg
      viewBox="0 0 200 30"
      className={className}
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>
      <LetterB x={0} strokeWidth={strokeWidth} />
      <LetterO x={17} strokeWidth={strokeWidth} />
      <LetterN x={34} strokeWidth={strokeWidth} />
      <LetterE x={52} strokeWidth={strokeWidth} />
      <Separator x={68} strokeWidth={strokeWidth} />
      <LetterK x={88} strokeWidth={strokeWidth} />
      <LetterO x={104} strokeWidth={strokeWidth} />
      <LetterB x={122} strokeWidth={strokeWidth} />
      <LetterO x={139} strokeWidth={strokeWidth} />
      <LetterY x={156} strokeWidth={strokeWidth} />
      <LetterI x={174} strokeWidth={strokeWidth} />
    </svg>
  );
}
