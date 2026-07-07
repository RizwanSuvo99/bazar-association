import bn from "@/dictionaries/bn.json";
import en from "@/dictionaries/en.json";
import type { Lang } from "./types";

export const DEFAULT_LANG: Lang = "bn";

export type Dict = typeof bn;

const dicts: Record<Lang, Dict> = { bn: bn as Dict, en: en as Dict };

export function getDictionary(lang: Lang): Dict {
  return dicts[lang] ?? dicts.bn;
}

/** Pick the localized value of a bilingual field pair, falling back to Bangla. */
export function localize(obj: unknown, base: string, lang: Lang): string {
  if (!obj || typeof obj !== "object") return "";
  const rec = obj as Record<string, unknown>;
  const value = lang === "en" ? rec[`${base}_en`] : rec[`${base}_bn`];
  return (value as string) || (rec[`${base}_bn`] as string) || "";
}

/** Dot-path lookup in a dictionary with {var} interpolation. */
export function translate(
  dict: Dict,
  key: string,
  vars?: Record<string, string | number>,
): string {
  const value = key.split(".").reduce<unknown>(
    (acc, part) => (acc && typeof acc === "object" ? (acc as Record<string, unknown>)[part] : undefined),
    dict,
  );
  let str = typeof value === "string" ? value : key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(`{${k}}`, String(v));
    }
  }
  return str;
}
