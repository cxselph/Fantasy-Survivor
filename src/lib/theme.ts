// Derives the small set of shades the UI needs (buttons, borders, focus rings, hover states)
// from a single admin-picked accent color, so the color picker only ever asks for one value.
// Pure HSL math, no color library - the target lightness percentages below are taken from
// Tailwind's own orange-50..700 scale (the app's original hardcoded color) and scaled relative
// to the picked color's own lightness, so shade 600 always equals exactly what was picked.

export const DEFAULT_ACCENT = "#ea580c"; // matches the original hardcoded orange-600

export const ACCENT_SHADE_KEYS = [50, 100, 300, 400, 500, 600, 700] as const;
export type AccentShadeKey = (typeof ACCENT_SHADE_KEYS)[number];

// Reference lightness (%) for each shade on Tailwind's real orange scale, and the reference
// shade (600) our scaling anchors to.
const TARGET_LIGHTNESS: Record<AccentShadeKey, number> = {
  50: 96.5,
  100: 91.8,
  300: 72.4,
  400: 61.0,
  500: 53.1,
  600: 48.2,
  700: 40.4,
};
const REFERENCE_LIGHTNESS = TARGET_LIGHTNESS[600];

function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return null;
  const int = parseInt(match[1], 16);
  const r = ((int >> 16) & 255) / 255;
  const g = ((int >> 8) & 255) / 255;
  const b = (int & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0;
  let s = 0;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: s * 100, l: l * 100 };
}

function hslToHex(h: number, s: number, l: number): string {
  const sNorm = s / 100;
  const lNorm = l / 100;
  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lNorm - c / 2;
  let [r, g, b] = [0, 0, 0];
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function generateAccentShades(baseHex: string | null | undefined): Record<AccentShadeKey, string> {
  const hsl = hexToHsl(baseHex || "") ?? hexToHsl(DEFAULT_ACCENT)!;
  const scale = hsl.l / REFERENCE_LIGHTNESS;

  const shades = {} as Record<AccentShadeKey, string>;
  for (const key of ACCENT_SHADE_KEYS) {
    const lightness = Math.min(99, Math.max(1, TARGET_LIGHTNESS[key] * scale));
    shades[key] = hslToHex(hsl.h, hsl.s, lightness);
  }
  // Shade 600 is always exactly the picked color, regardless of any rounding above.
  shades[600] = /^#?[0-9a-f]{6}$/i.test((baseHex || "").trim()) ? baseHex!.trim() : DEFAULT_ACCENT;
  return shades;
}
