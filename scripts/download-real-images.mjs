/**
 * Downloads real Unsplash photography into public/products and public/scenes.
 * Photos are free to use under the Unsplash License.
 *
 * Run: npm run images:real
 */
import { mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const PRODUCTS = path.join(ROOT, "public", "products");
const SCENES = path.join(ROOT, "public", "scenes");

/** Only IDs verified to return HTTP 200 from images.unsplash.com. */
const PRODUCT_SHOTS = {
  "bonecloth-trucker-jacket": [
    "1551028719-00167b16eac5",
    "1591047139829-d91aecb6caea",
  ],
  "dust-season-hoodie": [
    "1556821840-3a63f95609a7",
    "1620799140408-edc6dcb6d633",
  ],
  "ranch-hand-chore-coat": [
    "1487222477894-8943e31ef7b2",
    "1552374196-1ab2a1c593e8",
  ],
  "skull-and-spur-tee": [
    "1521572163474-6864f9cf17ab",
    "1562157873-818bc0726f68",
  ],
  "koboyi-rodeo-tee": [
    "1583743814966-8936f5b7be1a",
    "1503342217505-b0a15ec3261c",
  ],
  "ghost-rider-denim": [
    "1541099649105-f69ad21f3246",
    "1604176354204-9268737828e4",
  ],
  "cattle-trail-cargo-pant": [
    "1624378439575-d8705ad7ae80",
    "1473966968600-fa801b869a1a",
  ],
  "bone-yoke-western-shirt": [
    "1596755094514-f87e34085b2c",
    "1602810318383-e386cc2a3ccf",
  ],
  "saddle-stitch-overshirt": [
    "1618354691373-d851c5c3a990",
    "1617137968427-85924c800a22",
  ],
  "dust-devil-bandana": [
    "1601924994987-69e26d50dc26",
    "1558769132-cb1aea458c5e",
  ],
  "koboyi-ranch-cap": [
    "1588850561407-ed78c282e89b",
    "1521369909029-2afed882baee",
  ],
  "bleached-bone-crewneck": [
    "1576566588028-4147f3842f27",
    "1434389677669-e08b4cac3105",
  ],
};

const SCENES_SHOTS = {
  "hero-dust-season": { id: "1547471080-7cc2caa01a7e", w: 2400, h: 1350 },
  "editorial-ranch": { id: "1509316785289-025f5b846b35", w: 1800, h: 1200 },
  "collection-dust-season": { id: "1489392191049-fc10c97e64b6", w: 1600, h: 1000 },
  "collection-rodeo-nights": { id: "1506905925346-21bda4d32df4", w: 1600, h: 1000 },
  "collection-bone-basics": { id: "1490481651871-ab68de25d43d", w: 1600, h: 1000 },
};

function photoUrl(id, w, h) {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;
}

async function download(file, photoId, w, h) {
  const endpoint = photoUrl(photoId, w, h);
  const res = await fetch(endpoint, {
    headers: {
      Accept: "image/*",
      "User-Agent": "bone-koboyi-storefront/1.0",
    },
    redirect: "follow",
  });
  if (!res.ok) {
    throw new Error(`${res.status} ${endpoint}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 8000) {
    throw new Error(`Too small (${buf.length}b): ${endpoint}`);
  }
  writeFileSync(file, buf);
  console.log(`✓ ${path.relative(ROOT, file)} (${Math.round(buf.length / 1024)}kb)`);
}

async function main() {
  if (existsSync(PRODUCTS)) rmSync(PRODUCTS, { recursive: true });
  if (existsSync(SCENES)) rmSync(SCENES, { recursive: true });
  mkdirSync(PRODUCTS, { recursive: true });
  mkdirSync(SCENES, { recursive: true });

  for (const [slug, ids] of Object.entries(PRODUCT_SHOTS)) {
    for (let i = 0; i < ids.length; i += 1) {
      await download(path.join(PRODUCTS, `${slug}-${i + 1}.jpg`), ids[i], 1200, 1500);
    }
  }

  for (const [slug, meta] of Object.entries(SCENES_SHOTS)) {
    await download(path.join(SCENES, `${slug}.jpg`), meta.id, meta.w, meta.h);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
