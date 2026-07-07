"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Lang } from "./types";
import { translate, type Dict } from "./i18n";

interface I18nValue {
  lang: Lang;
  dict: Dict;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function LanguageProvider({
  lang,
  dict,
  children,
}: {
  lang: Lang;
  dict: Dict;
  children: ReactNode;
}) {
  const t = (key: string, vars?: Record<string, string | number>) => translate(dict, key, vars);
  return <I18nContext.Provider value={{ lang, dict, t }}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useTranslation must be used within a LanguageProvider");
  return ctx;
}
