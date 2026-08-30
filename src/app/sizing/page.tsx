import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/container";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Size Guide",
  description: `${site.positioning} Fit guide for MADE IN AFREEKA pieces.`,
};

const TOPS = [
  { size: "XS", chest: "34-36", length: "26" },
  { size: "S", chest: "36-38", length: "27" },
  { size: "M", chest: "38-40", length: "28" },
  { size: "L", chest: "40-42", length: "29" },
  { size: "XL", chest: "42-44", length: "30" },
  { size: "XXL", chest: "44-46", length: "31" },
];

const BOTTOMS = [
  { size: "XS", waist: "28-29", inseam: "30" },
  { size: "S", waist: "30-31", inseam: "30.5" },
  { size: "M", waist: "32-33", inseam: "31" },
  { size: "L", waist: "34-35", inseam: "31.5" },
  { size: "XL", waist: "36-37", inseam: "32" },
  { size: "XXL", waist: "38-40", inseam: "32.5" },
];

export default function SizingPage() {
  return (
    <Container className="py-12 lg:py-16">
      <header className="max-w-2xl">
        <p className="eyebrow">Fit</p>
        <h1 className="font-display mt-2 text-5xl tracking-[0.03em] lg:text-6xl">
          Size Guide
        </h1>
        <p className="mt-4 text-base leading-relaxed text-bone-dim">
          {site.positioning} Measure yourself once, then use the tables below -
          product pages note whether a piece runs true, boxy, or slim.
        </p>
      </header>

      <div className="mt-14 grid gap-12 lg:grid-cols-2">
        <SizeTable
          title="Tops & Outerwear"
          note="Chest is circumference. Length is from the high point of the shoulder to the hem."
          columns={["Size", "Chest (in)", "Length (in)"]}
          rows={TOPS.map((row) => [row.size, row.chest, row.length])}
        />
        <SizeTable
          title="Denim & Pants"
          note="Waist is the garment's measured waistband. Inseam is from the crotch seam to the hem."
          columns={["Size", "Waist (in)", "Inseam (in)"]}
          rows={BOTTOMS.map((row) => [row.size, row.waist, row.inseam])}
        />
      </div>

      <div className="craft-panel mt-16 bg-bone/80 p-8">
        <h2 className="font-display text-2xl tracking-[0.05em]">Still unsure?</h2>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-bone-dim">
          Email{" "}
          <a href={`mailto:${site.email}`} className="text-rust underline">
            {site.email}
          </a>{" "}
          with what you usually wear and which piece you&rsquo;re looking at. We&rsquo;ll
          tell you what to pick. Free returns within 30 days on unworn pieces.
        </p>
        <Link
          href="/shop"
          className="mt-6 inline-block text-xs tracking-[0.18em] text-bone-dim uppercase underline underline-offset-4 hover:text-rust"
        >
          Back to the shop
        </Link>
      </div>
    </Container>
  );
}

function SizeTable({
  title,
  note,
  columns,
  rows,
}: {
  title: string;
  note: string;
  columns: string[];
  rows: string[][];
}) {
  return (
    <div>
      <h2 className="font-display text-2xl tracking-[0.05em]">{title}</h2>
      <p className="mt-2 text-sm text-bone-dim">{note}</p>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[280px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-ash-line text-left">
              {columns.map((column) => (
                <th
                  key={column}
                  className="eyebrow py-3 pr-4 font-normal first:pr-6"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row[0]} className="border-b border-ash-line/60">
                {row.map((cell, index) => (
                  <td
                    key={`${row[0]}-${index}`}
                    className={`py-3 pr-4 tabular-nums ${
                      index === 0 ? "font-display tracking-[0.08em]" : "text-bone-dim"
                    }`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
