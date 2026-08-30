/**
 * Generates the placeholder product photography in `public/products`.
 *
 * These stand in for real studio shots so `next/image` has genuine raster
 * assets to optimize. Replace the files with real photography (same paths,
 * same 4:5 ratio) and this script can be deleted.
 *
 * Run with: npm run images
 */
import zlib from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const WIDTH = 1200;
const HEIGHT = 1500;

const OUT_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "public",
  "products",
);

/* ---------------------------------------------------------------- PNG ---- */

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
})();

function crc32(buffer) {
  let c = -1;
  for (let i = 0; i < buffer.length; i += 1) {
    c = CRC_TABLE[(c ^ buffer[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typed = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typed));
  return Buffer.concat([length, typed, crc]);
}

function encodePng(width, height, rgb) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bit depth
  header[9] = 2; // truecolour
  header[10] = 0; // deflate
  header[11] = 0; // adaptive filtering
  header[12] = 0; // no interlace

  const stride = width * 3;
  const raw = Buffer.alloc(height * (stride + 1));
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0; // filter type: none
    rgb.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/* ------------------------------------------------------------ drawing ---- */

const hexToRgb = (hex) => [
  parseInt(hex.slice(1, 3), 16) / 255,
  parseInt(hex.slice(3, 5), 16) / 255,
  parseInt(hex.slice(5, 7), 16) / 255,
];

const clamp01 = (n) => (n < 0 ? 0 : n > 1 ? 1 : n);
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

function smoothstep(edge0, edge1, x) {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/**
 * Abstract desert-western compositions: a graded sky, a low sun, a horizon
 * band and a soft vignette. Variant 1 shifts the framing to read as a
 * secondary "detail" shot in the product gallery.
 */
function render({
  sky,
  dusk,
  sun,
  ground,
  variant,
  width = WIDTH,
  height = HEIGHT,
}) {
  const skyColor = hexToRgb(sky);
  const duskColor = hexToRgb(dusk);
  const sunColor = hexToRgb(sun);
  const groundColor = hexToRgb(ground);

  const horizon = variant === 0 ? 0.66 : 0.78;
  const sunX = variant === 0 ? 0.5 : 0.72;
  const sunY = variant === 0 ? 0.42 : 0.56;
  const sunR = variant === 0 ? 0.26 : 0.36;

  const pixels = Buffer.alloc(width * height * 3);
  const aspect = width / height;

  for (let y = 0; y < height; y += 1) {
    const v = y / height;
    for (let x = 0; x < width; x += 1) {
      const u = x / width;

      let color = mix(skyColor, duskColor, smoothstep(0, 1, v));

      const dx = (u - sunX) * aspect;
      const dy = v - sunY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Halo, then the disc itself.
      color = mix(color, sunColor, 0.32 * (1 - smoothstep(sunR, sunR * 2.6, dist)));
      color = mix(color, sunColor, 1 - smoothstep(sunR * 0.97, sunR * 1.02, dist));

      // Ground plane, with a slight rise toward the edges of the frame.
      const rise = horizon + Math.pow(u - 0.5, 2) * 0.06;
      color = mix(color, groundColor, smoothstep(rise - 0.004, rise + 0.004, v));

      // Banding in the sky reads as haze and keeps the file compressible.
      if (v < rise) {
        const band = Math.sin(v * 46) * 0.5 + 0.5;
        color = color.map((c) => c * (1 + (band - 0.5) * 0.022));
      }

      // Vignette.
      const ex = (u - 0.5) * 2;
      const ey = (v - 0.5) * 2;
      const falloff = 1 - 0.22 * smoothstep(0.55, 1.45, Math.sqrt(ex * ex + ey * ey));
      color = color.map((c) => c * falloff);

      const offset = (y * width + x) * 3;
      pixels[offset] = Math.round(clamp01(color[0]) * 255);
      pixels[offset + 1] = Math.round(clamp01(color[1]) * 255);
      pixels[offset + 2] = Math.round(clamp01(color[2]) * 255);
    }
  }

  return encodePng(width, height, pixels);
}

/* ------------------------------------------------------------ catalog ---- */

// Keep these slugs in sync with `src/data/catalog.ts`.
const PALETTES = {
  "bonecloth-trucker-jacket": { sky: "#2b3440", dusk: "#101418", sun: "#c98a52", ground: "#0b0d10" },
  "dust-season-hoodie": { sky: "#c9b79c", dusk: "#8a745a", sun: "#f2ede4", ground: "#3d3428" },
  "ranch-hand-chore-coat": { sky: "#4a5b46", dusk: "#1e2620", sun: "#d8cbb0", ground: "#12160f" },
  "skull-and-spur-tee": { sky: "#f2ede4", dusk: "#cdc3b2", sun: "#b5563a", ground: "#20201d" },
  "koboyi-rodeo-tee": { sky: "#1a1a1c", dusk: "#08080a", sun: "#b5563a", ground: "#0e0e10" },
  "ghost-rider-denim": { sky: "#4e6684", dusk: "#1d2839", sun: "#e6ddcd", ground: "#12161f" },
  "cattle-trail-cargo-pant": { sky: "#a89170", dusk: "#5d4c38", sun: "#efe6d5", ground: "#2a2318" },
  "bone-yoke-western-shirt": { sky: "#efe7d9", dusk: "#b8a88c", sun: "#8a7a5e", ground: "#2c2a24" },
  "saddle-stitch-overshirt": { sky: "#8c5a3c", dusk: "#3a2318", sun: "#e8d5b5", ground: "#1c120c" },
  "dust-devil-bandana": { sky: "#b5563a", dusk: "#5c2418", sun: "#f2ede4", ground: "#2a1610" },
  "koboyi-ranch-cap": { sky: "#54605c", dusk: "#222a28", sun: "#d9cfbb", ground: "#141917" },
  "bleached-bone-crewneck": { sky: "#f4f0e8", dusk: "#d2c9b8", sun: "#ffffff", ground: "#26241f" },
};

// Wide editorial art for the home page and long-form pages.
const SCENES = {
  "hero-dust-season": {
    sky: "#2b3440",
    dusk: "#0a0c10",
    sun: "#c98a52",
    ground: "#07080a",
    variant: 0,
    width: 2400,
    height: 1350,
  },
  "editorial-ranch": {
    sky: "#b5563a",
    dusk: "#2a1610",
    sun: "#e8d5b5",
    ground: "#140c08",
    variant: 1,
    width: 1800,
    height: 1200,
  },
  "collection-rodeo-nights": {
    sky: "#1a1a1c",
    dusk: "#08080a",
    sun: "#b5563a",
    ground: "#0e0e10",
    variant: 1,
    width: 1600,
    height: 1000,
  },
  "collection-dust-season": {
    sky: "#c9b79c",
    dusk: "#6d5a44",
    sun: "#f2ede4",
    ground: "#2e2619",
    variant: 0,
    width: 1600,
    height: 1000,
  },
  "collection-bone-basics": {
    sky: "#f2ede4",
    dusk: "#c3b9a6",
    sun: "#ffffff",
    ground: "#24221d",
    variant: 0,
    width: 1600,
    height: 1000,
  },
};

const SCENES_DIR = path.join(OUT_DIR, "..", "scenes");

mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(SCENES_DIR, { recursive: true });

for (const [slug, palette] of Object.entries(PALETTES)) {
  for (const variant of [0, 1]) {
    const file = path.join(OUT_DIR, `${slug}-${variant + 1}.png`);
    writeFileSync(file, render({ ...palette, variant }));
    console.log(`wrote ${path.relative(process.cwd(), file)}`);
  }
}

for (const [slug, scene] of Object.entries(SCENES)) {
  const file = path.join(SCENES_DIR, `${slug}.png`);
  writeFileSync(file, render(scene));
  console.log(`wrote ${path.relative(process.cwd(), file)}`);
}
