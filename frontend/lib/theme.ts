import type { ThemeName } from "./types";

export interface ThemeMeta {
  name: ThemeName;
  label_bn: string;
  label_en: string;
  /** Accent hue in light mode (also the picker's left swatch half). */
  swatch: string;
  /** Accent hue in dark mode (the picker's right swatch half). */
  accent: string;
}

// Accent picker: every option shares the same dark/light base palette and only
// swaps the single accent hue. Names are fixed by the backend settings enum.
export const THEMES: ThemeMeta[] = [
  { name: "warm-amber", label_bn: "গোল্ড", label_en: "Gold", swatch: "#a16207", accent: "#f0b429" },
  { name: "royal-blue", label_bn: "টিল", label_en: "Teal", swatch: "#0f766e", accent: "#2dd4bf" },
  { name: "emerald", label_bn: "এমারল্ড", label_en: "Emerald", swatch: "#047857", accent: "#34d399" },
  { name: "crimson", label_bn: "ক্রিমসন", label_en: "Crimson", swatch: "#be123c", accent: "#fb7185" },
];

export const THEME_NAMES: ThemeName[] = THEMES.map((t) => t.name);

export function isThemeName(value: string | undefined): value is ThemeName {
  return !!value && (THEME_NAMES as string[]).includes(value);
}
