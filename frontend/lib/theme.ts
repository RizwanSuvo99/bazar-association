import type { ThemeName } from "./types";

export interface ThemeMeta {
  name: ThemeName;
  label_bn: string;
  label_en: string;
  swatch: string;
  accent: string;
}

export const THEMES: ThemeMeta[] = [
  { name: "emerald", label_bn: "এমারল্ড", label_en: "Emerald", swatch: "#059669", accent: "#f59e0b" },
  { name: "royal-blue", label_bn: "রয়্যাল ব্লু", label_en: "Royal Blue", swatch: "#2563eb", accent: "#38bdf8" },
  { name: "warm-amber", label_bn: "ওয়ার্ম অ্যাম্বার", label_en: "Warm Amber", swatch: "#d97706", accent: "#f59e0b" },
  { name: "crimson", label_bn: "ক্রিমসন", label_en: "Crimson", swatch: "#e11d48", accent: "#fb7185" },
];

export const THEME_NAMES: ThemeName[] = THEMES.map((t) => t.name);

export function isThemeName(value: string | undefined): value is ThemeName {
  return !!value && (THEME_NAMES as string[]).includes(value);
}
