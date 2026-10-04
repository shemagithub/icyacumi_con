"use client";

import { formatPrice } from "@/lib/format";

export type ChartPoint = { label: string; value: number };

const PALETTE = [
  "var(--portal-accent)",
  "var(--portal-ink)",
  "#c9a227",
  "#2f6f5e",
  "#7a4d3b",
  "#4f6b8a",
];

function compact(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  return String(Math.round(value));
}

function maxValue(points: ChartPoint[]) {
  return Math.max(1, ...points.map((point) => point.value));
}

function empty(points: ChartPoint[]) {
  return points.every((point) => point.value <= 0);
}

export function AdminLineChart({
  title,
  hint,
  points,
  money = false,
}: {
  title: string;
  hint: string;
  points: ChartPoint[];
  money?: boolean;
}) {
  const width = 640;
  const height = 220;
  const padX = 12;
  const padY = 18;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const peak = maxValue(points);
  const n = Math.max(1, points.length - 1);
  const coords = points.map((point, index) => {
    const x = padX + (index / n) * innerW;
    const y = padY + innerH - (point.value / peak) * innerH;
    return { x, y, ...point };
  });
  const line = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(" ");
  const area = `${line} L ${coords.at(-1)?.x ?? padX} ${padY + innerH} L ${padX} ${padY + innerH} Z`;
  const latest = points.at(-1)?.value ?? 0;

  return (
    <article className="admin-chart-card">
      <header className="admin-chart-card__head">
        <div>
          <h3>{title}</h3>
          <p>{hint}</p>
        </div>
        <p className="admin-chart-card__value">
          {money ? formatPrice(latest) : compact(latest)}
        </p>
      </header>
      {empty(points) ? (
        <p className="admin-chart-empty">No sales in this window yet.</p>
      ) : (
        <svg viewBox={`0 0 ${width} ${height}`} className="admin-chart-svg" role="img" aria-label={title}>
          <defs>
            <linearGradient id="admin-sales-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--portal-accent)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--portal-accent)" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((frac) => (
            <line
              key={frac}
              x1={padX}
              x2={width - padX}
              y1={padY + innerH * frac}
              y2={padY + innerH * frac}
              className="admin-chart-rule"
            />
          ))}
          <path d={area} fill="url(#admin-sales-fill)" />
          <path d={line} className="admin-chart-line" />
          {coords.map((c) => (
            <circle key={`${c.label}-${c.x}`} cx={c.x} cy={c.y} r="4.5" className="admin-chart-dot" />
          ))}
        </svg>
      )}
      <ol className="admin-chart-axis">
        {points.map((point) => (
          <li key={point.label}>{point.label}</li>
        ))}
      </ol>
    </article>
  );
}

export function AdminBarChart({
  title,
  hint,
  points,
  money = false,
}: {
  title: string;
  hint: string;
  points: ChartPoint[];
  money?: boolean;
}) {
  const peak = maxValue(points);
  return (
    <article className="admin-chart-card">
      <header className="admin-chart-card__head">
        <div>
          <h3>{title}</h3>
          <p>{hint}</p>
        </div>
      </header>
      {empty(points) ? (
        <p className="admin-chart-empty">Nothing to plot yet.</p>
      ) : (
        <ul className="admin-bar-list">
          {points.map((point, index) => (
            <li key={point.label}>
              <div className="admin-bar-list__meta">
                <span>{point.label}</span>
                <span className="tabular-nums">
                  {money ? formatPrice(point.value) : compact(point.value)}
                </span>
              </div>
              <div className="admin-bar-track">
                <span
                  className="admin-bar-fill"
                  style={{
                    width: `${Math.max(4, (point.value / peak) * 100)}%`,
                    background: PALETTE[index % PALETTE.length],
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

export function AdminDonutChart({
  title,
  hint,
  points,
  money = false,
}: {
  title: string;
  hint: string;
  points: ChartPoint[];
  money?: boolean;
}) {
  const total = points.reduce((sum, point) => sum + Math.max(0, point.value), 0);
  const radius = 58;
  const circ = 2 * Math.PI * radius;

  return (
    <article className="admin-chart-card">
      <header className="admin-chart-card__head">
        <div>
          <h3>{title}</h3>
          <p>{hint}</p>
        </div>
      </header>
      {total <= 0 ? (
        <p className="admin-chart-empty">No split to show yet.</p>
      ) : (
        <div className="admin-donut">
          <svg viewBox="0 0 160 160" className="admin-donut__svg" role="img" aria-label={title}>
            <circle cx="80" cy="80" r={radius} className="admin-donut__track" />
            {points.map((point, index) => {
              const len = (Math.max(0, point.value) / total) * circ;
              const startOffset = points
                .slice(0, index)
                .reduce(
                  (sum, prior) =>
                    sum + (Math.max(0, prior.value) / total) * circ,
                  0,
                );
              const dash = `${len} ${circ - len}`;
              return (
                <circle
                  key={point.label}
                  cx="80"
                  cy="80"
                  r={radius}
                  className="admin-donut__slice"
                  stroke={PALETTE[index % PALETTE.length]}
                  strokeDasharray={dash}
                  strokeDashoffset={-startOffset}
                />
              );
            })}
            <text x="80" y="76" textAnchor="middle" className="admin-donut__total">
              {compact(total)}
            </text>
            <text x="80" y="96" textAnchor="middle" className="admin-donut__unit">
              {money ? "RWF" : "total"}
            </text>
          </svg>
          <ul className="admin-donut__legend">
            {points.map((point, index) => (
              <li key={point.label}>
                <span style={{ background: PALETTE[index % PALETTE.length] }} />
                <div>
                  <p>{point.label}</p>
                  <p className="tabular-nums">
                    {money ? formatPrice(point.value) : compact(point.value)}
                    {total ? ` · ${Math.round((point.value / total) * 100)}%` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
