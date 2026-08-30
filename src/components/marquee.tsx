export function Marquee({ items }: { items: string[] }) {
  const track = [...items, ...items];

  return (
    <div className="relative overflow-hidden border-y-2 border-coal bg-indigo py-3 text-bone">
      <div
        className="pointer-events-none absolute inset-0 opacity-35 mix-blend-overlay"
        style={{
          backgroundImage: "url(/textures/denim.png)",
          backgroundSize: "320px",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-2 opacity-50"
        style={{
          backgroundImage: "url(/patterns/imigongo-tile.svg)",
          backgroundSize: "72px 100%",
          backgroundRepeat: "repeat-x",
          filter: "brightness(0) invert(1)",
        }}
        aria-hidden
      />
      <div className="marquee-track relative flex w-max items-center gap-10 whitespace-nowrap">
        {track.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="flex items-center gap-10 text-xs tracking-[0.24em] uppercase"
            aria-hidden={index >= items.length}
          >
            {item}
            <span className="text-paint-yellow" aria-hidden>
              ◆
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
