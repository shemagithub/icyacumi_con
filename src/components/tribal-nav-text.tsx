/**
 * Bold tribal display letters matching the brand alphabet sheet
 * (spikes, arrows, dots, organic fills) · used for navbar labels.
 */

import type { ReactNode } from "react";

type LetterProps = { x?: number; color?: string };

const DEFAULT = "currentColor";

function A({ x = 0, color = DEFAULT }: LetterProps) {
  return (
    <g transform={`translate(${x} 0)`} fill={color}>
      <path d="M12 2 L22 28 H17.2 L15.2 22 H8.8 L6.8 28 H2 L12 2Z" />
      <path d="M9.6 17 H14.4 L12 10Z" fill="var(--color-bone)" />
      <polygon points="12,0 13.4,3.2 10.6,3.2" />
      <polygon points="1,14 4.2,12.6 4.2,15.4" />
      <polygon points="23,14 19.8,12.6 19.8,15.4" />
      <circle cx="12" cy="14.5" r="1.35" fill="var(--color-bone)" />
    </g>
  );
}

function B({ x = 0, color = DEFAULT }: LetterProps) {
  return (
    <g transform={`translate(${x} 0)`} fill={color}>
      <path d="M3 2 H14 C19 2 22 5 22 9 C22 12 20 14 17 15 C21 16 24 18.5 24 23 C24 27 20 30 14 30 H3 V2Z" />
      <path d="M8 7 H13.5 C15.8 7 17 8.2 17 9.8 C17 11.4 15.8 12.6 13.5 12.6 H8 V7Z" fill="var(--color-bone)" />
      <path d="M8 17.5 H14.5 C17 17.5 19 19 19 21.5 C19 24 17 25.5 14.5 25.5 H8 V17.5Z" fill="var(--color-bone)" />
      <circle cx="12" cy="10" r="1.2" />
      <circle cx="13" cy="21.5" r="1.2" />
    </g>
  );
}

function C({ x = 0, color = DEFAULT }: LetterProps) {
  return (
    <g transform={`translate(${x} 0)`} fill={color}>
      <path d="M24 8.5 C21 3.5 16 1 11 1 C4.5 1 1 6.5 1 16 C1 25.5 4.5 31 11 31 C16 31 21 28.5 24 23.5 L19.5 21 C17.8 24 14.8 25.8 11.5 25.8 C8 25.8 6 22.5 6 16 C6 9.5 8 6.2 11.5 6.2 C14.8 6.2 17.8 8 19.5 11 Z" />
      <polygon points="23,7 26,5.5 25.2,9" />
      <polygon points="23,25 26,26.5 25.2,23" />
      <circle cx="20" cy="9.5" r="1.2" fill="var(--color-bone)" />
    </g>
  );
}

function D({ x = 0, color = DEFAULT }: LetterProps) {
  return (
    <g transform={`translate(${x} 0)`} fill={color}>
      <path d="M3 2 H13 C20 2 26 7.5 26 16 C26 24.5 20 30 13 30 H3 V2Z" />
      <path d="M8 7.5 H12.5 C16.5 7.5 20.5 10.5 20.5 16 C20.5 21.5 16.5 24.5 12.5 24.5 H8 V7.5Z" fill="var(--color-bone)" />
      <polygon points="3,0 5.2,2.8 0.8,2.8" />
      <polygon points="3,32 5.2,29.2 0.8,29.2" />
    </g>
  );
}

function E({ x = 0, color = DEFAULT }: LetterProps) {
  return (
    <g transform={`translate(${x} 0)`} fill={color}>
      <path d="M3 2 H23 V8 H9 V13 H20 V19 H9 V24 H23 V30 H3 V2Z" />
      <polygon points="23,2 26.5,5 23,8" />
      <polygon points="20,13 23.5,16 20,19" />
      <polygon points="23,24 26.5,27 23,30" />
      <circle cx="14" cy="16" r="1.3" fill="var(--color-bone)" />
    </g>
  );
}

function G({ x = 0, color = DEFAULT }: LetterProps) {
  return (
    <g transform={`translate(${x} 0)`} fill={color}>
      <path d="M24 8.5 C21 3.5 16 1 11 1 C4.5 1 1 6.5 1 16 C1 25.5 4.5 31 11 31 C16.5 31 21.5 28 24 22.5 V16 H14 V21 H18.5 C17 24.2 14.2 25.8 11.2 25.8 C7.8 25.8 6 22.2 6 16 C6 9.8 7.8 6.2 11.2 6.2 C14.5 6.2 17.5 8 19.2 11.2 Z" />
      <polygon points="24,16 27.5,14.2 27.5,17.8" />
      <circle cx="19.5" cy="18.5" r="1.2" fill="var(--color-bone)" />
    </g>
  );
}

function H({ x = 0, color = DEFAULT }: LetterProps) {
  return (
    <g transform={`translate(${x} 0)`} fill={color}>
      <path d="M3 2 H9 V12 H17 V2 H23 V30 H17 V18 H9 V30 H3 V2Z" />
      <polygon points="3,0 5.4,2.6 0.6,2.6" />
      <polygon points="23,0 25.4,2.6 20.6,2.6" />
      <polygon points="9,12 13,9.2 17,12 13,14.8" />
      <circle cx="13" cy="15" r="1.2" fill="var(--color-bone)" />
    </g>
  );
}

function I({ x = 0, color = DEFAULT }: LetterProps) {
  return (
    <g transform={`translate(${x} 0)`} fill={color}>
      <path d="M7 8 H15 V30 H7 V8Z" />
      <circle cx="11" cy="3.5" r="3.2" />
      <polygon points="7,8 11,5.5 15,8" />
      <polygon points="7,30 11,32.5 15,30" />
      <circle cx="11" cy="18" r="1.3" fill="var(--color-bone)" />
    </g>
  );
}

function L({ x = 0, color = DEFAULT }: LetterProps) {
  return (
    <g transform={`translate(${x} 0)`} fill={color}>
      <path d="M3 2 H9 V24 H23 V30 H3 V2Z" />
      <polygon points="3,0 5.4,2.6 0.6,2.6" />
      <polygon points="23,24 26,27 23,30" />
      <circle cx="15" cy="27" r="1.2" fill="var(--color-bone)" />
    </g>
  );
}

function M({ x = 0, color = DEFAULT }: LetterProps) {
  return (
    <g transform={`translate(${x} 0)`} fill={color}>
      <path d="M2 30 V2 H8 L14 16 L20 2 H26 V30 H20 V14 L14 26 L8 14 V30 H2Z" />
      <polygon points="2,0 4.4,2.6 -0.4,2.6" />
      <polygon points="26,0 28.4,2.6 23.6,2.6" />
      <circle cx="14" cy="18" r="1.25" fill="var(--color-bone)" />
    </g>
  );
}

function N({ x = 0, color = DEFAULT }: LetterProps) {
  return (
    <g transform={`translate(${x} 0)`} fill={color}>
      <path d="M3 30 V2 H9 L19 20 V2 H25 V30 H19 L9 12 V30 H3Z" />
      <polygon points="3,0 5.4,2.6 0.6,2.6" />
      <polygon points="25,32 27.4,29.4 22.6,29.4" />
      <circle cx="14" cy="16" r="1.2" fill="var(--color-bone)" />
    </g>
  );
}

function O({ x = 0, color = DEFAULT }: LetterProps) {
  return (
    <g transform={`translate(${x} 0)`} fill={color}>
      <ellipse cx="14" cy="16" rx="13" ry="15" />
      <ellipse cx="14" cy="16" rx="6.5" ry="8" fill="var(--color-bone)" />
      <polygon points="14,1 16,4.2 12,4.2" />
      <polygon points="1,16 4.2,14.2 4.2,17.8" />
      <polygon points="27,16 23.8,14.2 23.8,17.8" />
      <polygon points="14,31 16,27.8 12,27.8" />
      <circle cx="14" cy="16" r="1.5" />
    </g>
  );
}

function R({ x = 0, color = DEFAULT }: LetterProps) {
  return (
    <g transform={`translate(${x} 0)`} fill={color}>
      <path d="M3 2 H15 C20.5 2 24 5.5 24 10.5 C24 14.5 21.5 17.5 17.5 18.5 L25 30 H18.5 L12 19 H9 V30 H3 V2Z" />
      <path d="M9 7 H14.5 C16.8 7 18.5 8.5 18.5 10.5 C18.5 12.5 16.8 14 14.5 14 H9 V7Z" fill="var(--color-bone)" />
      <polygon points="25,30 28.5,27.5 26.5,32" />
      <circle cx="13" cy="10.5" r="1.2" />
    </g>
  );
}

function S({ x = 0, color = DEFAULT }: LetterProps) {
  return (
    <g transform={`translate(${x} 0)`} fill={color}>
      <path d="M22 8 C20 3.5 16 1 11.5 1 C6 1 2 4.5 2 9.5 C2 14 5 16 11 18 L15 19.5 C18.5 20.8 20 22.5 20 25 C20 27.5 17.5 29.5 13.5 29.5 C9.5 29.5 6.5 27.5 5.5 24.5 L1 26 C2.8 31 7.5 34 13.5 34 C20.5 34 26 30 26 24.5 C26 19.5 22.5 16.5 16.5 14.5 L12.5 13 C8.5 11.5 7.5 10.2 7.5 8.8 C7.5 6.8 9.2 5.5 11.8 5.5 C14.5 5.5 16.8 6.8 17.8 9 Z" />
      <circle cx="19" cy="8" r="1.3" fill="var(--color-bone)" />
      <polygon points="22,7 25,5 24.5,9" />
    </g>
  );
}

function T({ x = 0, color = DEFAULT }: LetterProps) {
  return (
    <g transform={`translate(${x} 0)`} fill={color}>
      <path d="M2 2 H24 V8 H16 V30 H10 V8 H2 V2Z" />
      <polygon points="2,2 -1,5 2,8" />
      <polygon points="24,2 27,5 24,8" />
      <polygon points="10,30 13,32.8 16,30" />
      <circle cx="13" cy="5" r="1.2" fill="var(--color-bone)" />
    </g>
  );
}

function U({ x = 0, color = DEFAULT }: LetterProps) {
  return (
    <g transform={`translate(${x} 0)`} fill={color}>
      <path d="M3 2 H9 V18 C9 23 11 26.5 14.5 26.5 C18 26.5 20 23 20 18 V2 H26 V18.5 C26 27 21.5 32 14.5 32 C7.5 32 3 27 3 18.5 V2Z" />
      <circle cx="14.5" cy="20" r="1.3" fill="var(--color-bone)" />
    </g>
  );
}

function Z({ x = 0, color = DEFAULT }: LetterProps) {
  return (
    <g transform={`translate(${x} 0)`} fill={color}>
      <path d="M3 2 H25 V8 L10 24 H25 V30 H3 V24 L18 8 H3 V2Z" />
      <polygon points="25,2 28,5 25,8" />
      <polygon points="3,24 0,27 3,30" />
      <circle cx="14" cy="16" r="1.25" fill="var(--color-bone)" />
    </g>
  );
}

const LETTERS: Record<string, (props: LetterProps) => ReactNode> = {
  A,
  B,
  C,
  D,
  E,
  G,
  H,
  I,
  L,
  M,
  N,
  O,
  R,
  S,
  T,
  U,
  Z,
};

/** Approximate advance widths for tracking */
const WIDTHS: Record<string, number> = {
  A: 24,
  B: 26,
  C: 26,
  D: 28,
  E: 26,
  G: 26,
  H: 26,
  I: 18,
  L: 24,
  M: 28,
  N: 28,
  O: 28,
  R: 26,
  S: 26,
  T: 26,
  U: 28,
  Z: 26,
};

export function TribalNavText({
  text,
  className,
  height = 14,
}: {
  text: string;
  className?: string;
  /** Visual height in px */
  height?: number;
}) {
  const chars = text.toUpperCase().split("");
  const gap = 3;
  let cursor = 0;
  const placed: { ch: string; x: number }[] = [];

  for (const ch of chars) {
    if (ch === " ") {
      cursor += 10;
      continue;
    }
    placed.push({ ch, x: cursor });
    cursor += (WIDTHS[ch] ?? 24) + gap;
  }

  const width = Math.max(cursor - gap, 1);
  const viewH = 34;

  return (
    <svg
      viewBox={`0 0 ${width} ${viewH}`}
      width={Math.round((width / viewH) * height)}
      height={height}
      className={className}
      role="img"
      aria-label={text}
      xmlns="http://www.w3.org/2000/svg"
    >
      {placed.map(({ ch, x }, i) => {
        const Letter = LETTERS[ch];
        if (!Letter) return null;
        return <Letter key={`${ch}-${i}`} x={x} />;
      })}
    </svg>
  );
}
