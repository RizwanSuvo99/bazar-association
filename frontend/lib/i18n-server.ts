import "server-only";
import { cookies } from "next/headers";
import type { Lang } from "./types";
import { DEFAULT_LANG, getDictionary } from "./i18n";

export async function getLang(): Promise<Lang> {
  const value = (await cookies()).get("lang")?.value;
  return value === "en" ? "en" : "bn";
}

/** Convenience for server components: current language + its dictionary. */
export async function getI18n() {
  const lang = await getLang();
  return { lang: lang ?? DEFAULT_LANG, dict: getDictionary(lang) };
}
