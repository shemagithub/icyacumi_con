export const DISPLAY_FONT_VIBES = ["brand", "casual", "loud", "crazy", "fancy"] as const;
export type DisplayFontVibe = (typeof DISPLAY_FONT_VIBES)[number];

export type DisplayFont = {
  id: string;
  label: string;
  /** CSS font-family stack */
  family: string;
  /** Google Fonts family name, or null if already bundled */
  google: string | null;
  vibe: DisplayFontVibe;
};

export const DISPLAY_FONTS: DisplayFont[] = [
  { id: "marker", label: "Marker (current nav)", family: '"Permanent Marker", cursive', google: null, vibe: "brand" },
  { id: "nunito", label: "Nunito (current name)", family: "Nunito, ui-sans-serif, sans-serif", google: null, vibe: "brand" },
  { id: "figtree", label: "Figtree", family: "Figtree, ui-sans-serif, sans-serif", google: null, vibe: "brand" },

  { id: "fredoka", label: "Fredoka", family: "Fredoka, sans-serif", google: "Fredoka:wght@500;700", vibe: "casual" },
  { id: "comic-neue", label: "Comic Neue", family: '"Comic Neue", cursive', google: "Comic+Neue:wght@700", vibe: "casual" },
  { id: "kalam", label: "Kalam", family: "Kalam, cursive", google: "Kalam:wght@700", vibe: "casual" },
  { id: "patrick-hand", label: "Patrick Hand", family: '"Patrick Hand", cursive', google: "Patrick+Hand", vibe: "casual" },
  { id: "indie-flower", label: "Indie Flower", family: '"Indie Flower", cursive', google: "Indie+Flower", vibe: "casual" },
  { id: "caveat", label: "Caveat", family: "Caveat, cursive", google: "Caveat:wght@600;700", vibe: "casual" },
  { id: "architects", label: "Architects Daughter", family: '"Architects Daughter", cursive', google: "Architects+Daughter", vibe: "casual" },
  { id: "shadows", label: "Shadows Into Light", family: '"Shadows Into Light", cursive', google: "Shadows+Into+Light", vibe: "casual" },
  { id: "amatic", label: "Amatic SC", family: '"Amatic SC", cursive', google: "Amatic+SC:wght@700", vibe: "casual" },
  { id: "gloria", label: "Gloria Hallelujah", family: '"Gloria Hallelujah", cursive', google: "Gloria+Hallelujah", vibe: "casual" },
  { id: "handlee", label: "Handlee", family: "Handlee, cursive", google: "Handlee", vibe: "casual" },
  { id: "rock-salt", label: "Rock Salt", family: '"Rock Salt", cursive', google: "Rock+Salt", vibe: "casual" },

  { id: "bangers", label: "Bangers", family: "Bangers, cursive", google: "Bangers", vibe: "loud" },
  { id: "bebas", label: "Bebas Neue", family: '"Bebas Neue", sans-serif', google: "Bebas+Neue", vibe: "loud" },
  { id: "anton", label: "Anton", family: "Anton, sans-serif", google: "Anton", vibe: "loud" },
  { id: "oswald", label: "Oswald", family: "Oswald, sans-serif", google: "Oswald:wght@600;700", vibe: "loud" },
  { id: "luckiest", label: "Luckiest Guy", family: '"Luckiest Guy", cursive', google: "Luckiest+Guy", vibe: "loud" },
  { id: "bungee", label: "Bungee", family: "Bungee, cursive", google: "Bungee", vibe: "loud" },
  { id: "londrina", label: "Londrina Solid", family: '"Londrina Solid", cursive', google: "Londrina+Solid", vibe: "loud" },
  { id: "shrikhand", label: "Shrikhand", family: "Shrikhand, cursive", google: "Shrikhand", vibe: "loud" },
  { id: "righteous", label: "Righteous", family: "Righteous, cursive", google: "Righteous", vibe: "loud" },
  { id: "spicy-rice", label: "Spicy Rice", family: '"Spicy Rice", cursive', google: "Spicy+Rice", vibe: "loud" },
  { id: "chicle", label: "Chicle", family: "Chicle, cursive", google: "Chicle", vibe: "loud" },
  { id: "bagel", label: "Bagel Fat One", family: '"Bagel Fat One", cursive', google: "Bagel+Fat+One", vibe: "loud" },
  { id: "black-ops", label: "Black Ops One", family: '"Black Ops One", cursive', google: "Black+Ops+One", vibe: "loud" },
  { id: "russo", label: "Russo One", family: '"Russo One", sans-serif', google: "Russo+One", vibe: "loud" },

  { id: "creepster", label: "Creepster", family: "Creepster, cursive", google: "Creepster", vibe: "crazy" },
  { id: "nosifer", label: "Nosifer", family: "Nosifer, cursive", google: "Nosifer", vibe: "crazy" },
  { id: "eater", label: "Eater", family: "Eater, cursive", google: "Eater", vibe: "crazy" },
  { id: "bungee-shade", label: "Bungee Shade", family: '"Bungee Shade", cursive', google: "Bungee+Shade", vibe: "crazy" },
  { id: "monoton", label: "Monoton", family: "Monoton, cursive", google: "Monoton", vibe: "crazy" },
  { id: "wet-paint", label: "Rubik Wet Paint", family: '"Rubik Wet Paint", cursive', google: "Rubik+Wet+Paint", vibe: "crazy" },
  { id: "press-start", label: "Press Start 2P", family: '"Press Start 2P", cursive', google: "Press+Start+2P", vibe: "crazy" },
  { id: "butcherman", label: "Butcherman", family: "Butcherman, cursive", google: "Butcherman", vibe: "crazy" },
  { id: "fascinate", label: "Fascinate Inline", family: '"Fascinate Inline", cursive', google: "Fascinate+Inline", vibe: "crazy" },
  { id: "fontdiner", label: "Fontdiner Swanky", family: '"Fontdiner Swanky", cursive', google: "Fontdiner+Swanky", vibe: "crazy" },
  { id: "special-elite", label: "Special Elite", family: '"Special Elite", cursive', google: "Special+Elite", vibe: "crazy" },
  { id: "tilt-prism", label: "Tilt Prism", family: '"Tilt Prism", cursive', google: "Tilt+Prism", vibe: "crazy" },

  { id: "pacifico", label: "Pacifico", family: "Pacifico, cursive", google: "Pacifico", vibe: "fancy" },
  { id: "lobster", label: "Lobster", family: "Lobster, cursive", google: "Lobster", vibe: "fancy" },
  { id: "great-vibes", label: "Great Vibes", family: '"Great Vibes", cursive', google: "Great+Vibes", vibe: "fancy" },
  { id: "playfair", label: "Playfair Display", family: '"Playfair Display", serif', google: "Playfair+Display:wght@700", vibe: "fancy" },
  { id: "abril", label: "Abril Fatface", family: '"Abril Fatface", serif', google: "Abril+Fatface", vibe: "fancy" },
  { id: "cinzel", label: "Cinzel", family: "Cinzel, serif", google: "Cinzel:wght@700", vibe: "fancy" },
];

export const DISPLAY_FONT_IDS = DISPLAY_FONTS.map((font) => font.id);

export const FONT_VIBE_LABEL: Record<DisplayFontVibe, string> = {
  brand: "Current brand",
  casual: "Casual / handwritten",
  loud: "Loud / poster",
  crazy: "Wildest",
  fancy: "Fancy / script",
};

export function getDisplayFont(id: string | undefined): DisplayFont {
  return DISPLAY_FONTS.find((font) => font.id === id) ?? DISPLAY_FONTS[0]!;
}

/** One Google CSS2 URL per chunk so a long picker list does not 400. */
export function googleFontsHrefs(ids: string[]): string[] {
  const families = [
    ...new Set(
      ids
        .map((id) => getDisplayFont(id).google)
        .filter((name): name is string => Boolean(name)),
    ),
  ];
  const hrefs: string[] = [];
  for (let i = 0; i < families.length; i += 8) {
    const chunk = families.slice(i, i + 8);
    const query = chunk
      .map((name) => `family=${name.replaceAll(";", "%3B")}`)
      .join("&");
    hrefs.push(`https://fonts.googleapis.com/css2?${query}&display=swap`);
  }
  return hrefs;
}
