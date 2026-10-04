import { googleFontsHrefs } from "@/lib/site-fonts";

/** Server-rendered Google Font links so the chosen faces paint on first load. */
export function StoreFontLinks({ fontIds }: { fontIds: string[] }) {
  const hrefs = googleFontsHrefs(fontIds);
  if (!hrefs.length) return null;
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      {hrefs.map((href) => (
        <link key={href} rel="stylesheet" href={href} />
      ))}
    </>
  );
}
