import type { Category, Collection, Product } from "@/lib/types";

/**
 * Seed catalog for the storefront.
 *
 * This is the single source of product truth today. Everything reads it
 * through `src/lib/products.ts`, so replacing it with a database or CMS
 * only means rewriting that module.
 */

const APPAREL_SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;
const TOP_SIZES = ["S", "M", "L", "XL", "XXL"] as const;
const ONE_SIZE = ["OS"] as const;

export const categories: Category[] = [
  {
    slug: "outerwear",
    name: "Outerwear",
    description: "Waxed canvas, blanket linings and hardware that outlasts the jacket.",
  },
  {
    slug: "fleece",
    name: "Fleece",
    description: "Heavyweight loopback cotton, garment dyed and pre-shrunk.",
  },
  {
    slug: "tees",
    name: "T-Shirts",
    description: "Boxy 240gsm cotton, cut so it still fits after fifty washes.",
  },
  {
    slug: "shirts",
    name: "Shirts",
    description: "Western yokes, pearl snaps and chainstitch detailing.",
  },
  {
    slug: "denim",
    name: "Denim",
    description: "Raw and once-washed selvedge from a single mill.",
  },
  {
    slug: "pants",
    name: "Pants",
    description: "Utility cuts in canvas and twill with room to move.",
  },
  {
    slug: "accessories",
    name: "Accessories",
    description: "The small things that finish the fit.",
  },
];

export const collections: Collection[] = [
  {
    slug: "dust-season",
    name: "Dust Season",
    description:
      "Sun-bleached neutrals and heavyweight workwear cut for long days and cold nights.",
  },
  {
    slug: "rodeo-nights",
    name: "Rodeo Nights",
    description:
      "Black on black with rust accents. Sharper cuts for after the sun goes down.",
  },
  {
    slug: "bone-basics",
    name: "Bone Basics",
    description: "The permanent collection. Restocked, never redesigned.",
  },
];

/** Campaign editorial looks · used as product imagery on the shop. */
const LOOKS = [1, 2, 3, 4] as const;
type Look = (typeof LOOKS)[number];

const image = (look: Look, alt: string) => ({
  src: `/editorial/look-0${look}.png`,
  alt,
});

/** Pair of looks for primary + hover; cycles through the campaign set. */
const lookPair = (index: number, name: string) => {
  const primary = LOOKS[index % LOOKS.length]!;
  const secondary = LOOKS[(index + 1) % LOOKS.length]!;
  return [
    image(primary, `${name}, campaign look`),
    image(secondary, `${name}, alternate look`),
  ];
};

export const products: Product[] = [
  {
    id: "bk-001",
    slug: "bonecloth-trucker-jacket",
    name: "Bonecloth Trucker Jacket",
    tagline: "14oz waxed canvas, blanket-lined",
    description:
      "Our take on the ranch trucker, cut a touch longer in the body so it layers over a hoodie without riding up. The waxed canvas starts stiff and breaks in around your shoulders over the first month. Wool blanket lining through the body, corduroy collar, and antique brass hardware that patinas instead of chipping.",
    price: 24800,
    compareAtPrice: 27800,
    category: "outerwear",
    collection: "dust-season",
    colors: [
      { name: "Coal", hex: "#17171A" },
      { name: "Sand", hex: "#C9A87C" },
    ],
    sizes: [...APPAREL_SIZES],
    images: lookPair(0, "Bonecloth Trucker Jacket"),
    fabric: "14oz waxed cotton canvas, wool blanket lining",
    fit: "Regular. Size down for a close fit.",
    details: [
      "Corduroy collar and cuff facing",
      "Antique brass shank buttons",
      "Two chest flap pockets, two hand-warmer pockets",
      "Re-waxable finish",
    ],
    badge: "Signature",
    featured: true,
    inStock: true,
    stockQuantity: 25,
    vendorId: "v-bone",
    views: 18420,
    credits: [
      { role: "Tailor", name: "Jean Bosco" },
      { role: "Photographer", name: "Aline N." },
    ],
  },
  {
    id: "bk-002",
    slug: "dust-season-hoodie",
    name: "Dust Season Hoodie",
    tagline: "Garment-dyed 480gsm loopback",
    description:
      "Heavy enough to stand on its own in October. We garment dye every piece after construction, so the color settles unevenly across the seams and keeps moving as it wears. Double-lined hood, boxy body, ribbing that holds its shape.",
    price: 14800,
    compareAtPrice: 17800,
    category: "fleece",
    collection: "dust-season",
    colors: [
      { name: "Bone", hex: "#EDE6D8" },
      { name: "Clay", hex: "#8C5A3C" },
      { name: "Coal", hex: "#17171A" },
    ],
    sizes: [...TOP_SIZES],
    images: lookPair(1, "Dust Season Hoodie"),
    fabric: "480gsm garment-dyed cotton loopback",
    fit: "Boxy. True to size.",
    details: [
      "Double-lined hood with flat drawcord",
      "Raw-edge kangaroo pocket",
      "Ribbed cuffs and hem",
      "Pre-shrunk",
    ],
    badge: "On Sale",
    featured: true,
    inStock: true,
    stockQuantity: 25,
    vendorId: "v-dust",
    views: 22100,
  },
  {
    id: "bk-003",
    slug: "ranch-hand-chore-coat",
    name: "Ranch Hand Chore Coat",
    tagline: "Triple-stitched work canvas",
    description:
      "A chore coat that earns its name. Four deep pockets, triple-stitched seams at every stress point, and a hem that clears the hip so it works over denim. Cut from a dry canvas that softens without going slack.",
    price: 28600,
    compareAtPrice: 32000,
    category: "outerwear",
    collection: "dust-season",
    colors: [
      { name: "Sagebrush", hex: "#6B7A63" },
      { name: "Coal", hex: "#17171A" },
    ],
    sizes: [...APPAREL_SIZES],
    images: lookPair(2, "Ranch Hand Chore Coat"),
    fabric: "12oz dry cotton canvas",
    fit: "Relaxed. Size down if layering light.",
    details: [
      "Four-pocket configuration",
      "Triple-stitched seams",
      "Hidden interior chest pocket",
      "Corozo buttons",
    ],
    featured: true,
    inStock: true,
    stockQuantity: 25,
    vendorId: "v-dust",
    views: 9800,
  },
  {
    id: "bk-004",
    slug: "skull-and-spur-tee",
    name: "Skull & Spur Tee",
    tagline: "240gsm boxy cotton",
    description:
      "Hand-drawn skull and spur artwork, screen printed with a soft-hand water-based ink so it sits in the fabric rather than on top of it. The print cracks the way a good print should.",
    price: 6800,
    compareAtPrice: 8800,
    category: "tees",
    collection: "rodeo-nights",
    colors: [
      { name: "Bone", hex: "#EDE6D8" },
      { name: "Coal", hex: "#17171A" },
    ],
    sizes: [...TOP_SIZES],
    images: lookPair(3, "Skull & Spur Tee"),
    fabric: "240gsm combed ring-spun cotton",
    fit: "Boxy, slightly cropped. True to size.",
    details: [
      "Water-based discharge print",
      "Ribbed neck with taped shoulders",
      "Single-needle hem",
    ],
    featured: true,
    inStock: true,
    stockQuantity: 25,
    vendorId: "v-rodeo",
    views: 15600,
  },
  {
    id: "bk-005",
    slug: "koboyi-rodeo-tee",
    name: "Koboyi Rodeo Tee",
    tagline: "Puff-print back graphic",
    description:
      "Full-width rodeo graphic across the back in raised puff ink, with a small chest hit up front. Heavier than a standard tee and cut with a dropped shoulder.",
    price: 7200,
    category: "tees",
    collection: "rodeo-nights",
    colors: [
      { name: "Coal", hex: "#17171A" },
      { name: "Rust", hex: "#B5563A" },
    ],
    sizes: [...TOP_SIZES],
    images: lookPair(4, "Koboyi Rodeo Tee"),
    fabric: "260gsm heavyweight cotton",
    fit: "Dropped shoulder. True to size.",
    details: ["Raised puff-ink back print", "Woven hem label", "Pre-shrunk"],
    inStock: true,
    stockQuantity: 25,
    vendorId: "v-rodeo",
    views: 7200,
  },
  {
    id: "bk-006",
    slug: "ghost-rider-denim",
    name: "Ghost Rider Denim",
    tagline: "13.5oz selvedge, once washed",
    description:
      "Straight leg with a slight taper below the knee so it stacks over a boot instead of bunching. Woven on shuttle looms and washed once to take out the shrink, so what you try on is what you keep.",
    price: 19800,
    compareAtPrice: 22800,
    category: "denim",
    collection: "bone-basics",
    colors: [
      { name: "Indigo", hex: "#2E4057" },
      { name: "Coal", hex: "#17171A" },
    ],
    sizes: [...APPAREL_SIZES],
    images: lookPair(5, "Ghost Rider Denim"),
    fabric: "13.5oz selvedge denim",
    fit: "Straight with a boot taper. True to size.",
    details: [
      "Shuttle-loom selvedge outseam",
      "Copper rivets, hidden at the back pockets",
      "Chainstitched hem",
      "Once washed, minimal further shrinkage",
    ],
    featured: true,
    inStock: true,
    stockQuantity: 25,
    vendorId: "v-rodeo",
    views: 19300,
  },
  {
    id: "bk-007",
    slug: "cattle-trail-cargo-pant",
    name: "Cattle Trail Cargo Pant",
    tagline: "Double-knee utility twill",
    description:
      "Built off a work pant pattern: double knee, gusseted crotch, and cargo pockets set back on the leg so they stay out of the way. Roomy through the thigh without looking sloppy.",
    price: 17800,
    compareAtPrice: 19800,
    category: "pants",
    collection: "dust-season",
    colors: [
      { name: "Sand", hex: "#C9A87C" },
      { name: "Sagebrush", hex: "#6B7A63" },
      { name: "Coal", hex: "#17171A" },
    ],
    sizes: [...APPAREL_SIZES],
    images: lookPair(6, "Cattle Trail Cargo Pant"),
    fabric: "10oz cotton utility twill",
    fit: "Relaxed straight. True to size.",
    details: [
      "Reinforced double knee",
      "Gusseted crotch for movement",
      "Bellowed cargo pockets",
      "Bar-tacked stress points",
    ],
    inStock: true,
    stockQuantity: 25,
    vendorId: "v-dust",
    views: 6100,
  },
  {
    id: "bk-008",
    slug: "bone-yoke-western-shirt",
    name: "Bone Yoke Western Shirt",
    tagline: "Pearl snaps, chainstitch yoke",
    description:
      "A proper western shirt: pointed front and back yokes, smoked pearl snaps, and sawtooth pockets. Chainstitch embroidery along the yoke, done on a vintage machine one shirt at a time.",
    price: 16400,
    category: "shirts",
    collection: "rodeo-nights",
    colors: [
      { name: "Bone", hex: "#EDE6D8" },
      { name: "Indigo", hex: "#2E4057" },
    ],
    sizes: [...TOP_SIZES],
    images: lookPair(7, "Bone Yoke Western Shirt"),
    fabric: "Brushed cotton twill",
    fit: "Slim through the body. Size up for a relaxed fit.",
    details: [
      "Smoked pearl snap closure",
      "Pointed front and back yokes",
      "Sawtooth flap pockets",
      "Chainstitch embroidery",
    ],
    inStock: true,
    stockQuantity: 25,
    vendorId: "v-bone",
    views: 5400,
  },
  {
    id: "bk-009",
    slug: "saddle-stitch-overshirt",
    name: "Saddle Stitch Overshirt",
    tagline: "Shirt jacket in brushed moleskin",
    description:
      "The layer for days that can't decide. Brushed moleskin with contrast saddle stitching down the placket, cut long enough to work as a light jacket over a tee.",
    price: 19600,
    category: "shirts",
    collection: "dust-season",
    colors: [
      { name: "Clay", hex: "#8C5A3C" },
      { name: "Sand", hex: "#C9A87C" },
    ],
    sizes: [...TOP_SIZES],
    images: lookPair(8, "Saddle Stitch Overshirt"),
    fabric: "Brushed cotton moleskin",
    fit: "Relaxed overshirt. True to size.",
    details: [
      "Contrast saddle stitching",
      "Twin chest pockets",
      "Horn-look buttons",
      "Extended back hem",
    ],
    inStock: true,
    stockQuantity: 25,
    vendorId: "v-dust",
    views: 8800,
  },
  {
    id: "bk-010",
    slug: "dust-devil-bandana",
    name: "Dust Devil Bandana",
    tagline: "Sandwashed cotton, 22 inch",
    description:
      "Screen printed in-house on sandwashed cotton, so it's soft out of the package instead of after a month. Big enough to actually tie around your neck.",
    price: 3800,
    compareAtPrice: 4800,
    category: "accessories",
    collection: "bone-basics",
    colors: [
      { name: "Rust", hex: "#B5563A" },
      { name: "Bone", hex: "#EDE6D8" },
    ],
    sizes: [...ONE_SIZE],
    images: lookPair(9, "Dust Devil Bandana"),
    fabric: "Sandwashed cotton",
    fit: "22 x 22 inches",
    details: ["Screen printed in-house", "Rolled and stitched edge"],
    inStock: true,
    stockQuantity: 25,
    vendorId: "v-ink",
    views: 11200,
  },
  {
    id: "bk-011",
    slug: "koboyi-ranch-cap",
    name: "Koboyi Ranch Cap",
    tagline: "Unstructured six-panel",
    description:
      "Low-profile six-panel in washed canvas with a soft, unstructured front that sits down on your head. Embroidered mark, brass slider closure.",
    price: 5800,
    compareAtPrice: 6800,
    category: "accessories",
    collection: "bone-basics",
    colors: [
      { name: "Sagebrush", hex: "#6B7A63" },
      { name: "Coal", hex: "#17171A" },
      { name: "Bone", hex: "#EDE6D8" },
    ],
    sizes: [...ONE_SIZE],
    images: lookPair(10, "Koboyi Ranch Cap"),
    fabric: "Washed cotton canvas",
    fit: "Adjustable, one size",
    details: ["Unstructured low profile", "Brass slider closure", "Embroidered mark"],
    inStock: true,
    stockQuantity: 25,
    vendorId: "v-ink",
    views: 13400,
  },
  {
    id: "bk-012",
    slug: "bleached-bone-crewneck",
    name: "Bleached Bone Crewneck",
    tagline: "Sun-faded heavyweight fleece",
    description:
      "Each crewneck is bleached by hand, so no two fade the same way. Same 480gsm loopback as the hoodie with a wide, flat ribbed collar that won't stretch out.",
    price: 13800,
    category: "fleece",
    collection: "bone-basics",
    colors: [
      { name: "Bone", hex: "#EDE6D8" },
      { name: "Sand", hex: "#C9A87C" },
    ],
    sizes: [...TOP_SIZES],
    images: lookPair(11, "Bleached Bone Crewneck"),
    fabric: "480gsm cotton loopback, hand bleached",
    fit: "Boxy. True to size.",
    details: [
      "Hand bleached · every piece differs",
      "Wide flat-ribbed collar",
      "Reinforced V-insert at the neck",
    ],
    inStock: false,
    stockQuantity: 0,
    vendorId: "v-bone",
    views: 4100,
  },
];
