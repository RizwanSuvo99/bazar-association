"use client";

import { useEffect, useState } from "react";
import { ConfigProvider, theme as antdTheme } from "antd";
import bnBD from "antd/locale/bn_BD";
import enUS from "antd/locale/en_US";
import { useTranslation } from "@/lib/i18n-context";

/** Site tokens antd needs to blend in, read straight from the live CSS variables. */
type Tokens = {
  colorPrimary: string;
  colorBgContainer: string;
  colorBgElevated: string;
  colorText: string;
  colorTextPlaceholder: string;
  colorBorder: string;
};

/**
 * Seed values, mirroring the :root and .dark blocks in globals.css.
 *
 * There must be a LIGHT set as well as a DARK one. antd derives every neutral it is not
 * explicitly handed — disabled text, split lines, icons, hover fills — from the algorithm's
 * base colour. Handing the light algorithm a dark surface produced a black panel with
 * near-invisible text until the effect below replaced the tokens.
 */
const DARK: Tokens = {
  colorPrimary: "#f0b429",
  colorBgContainer: "#232327",
  colorBgElevated: "#1c1c1f",
  colorText: "#f2f2f2",
  colorTextPlaceholder: "#a0a0a5",
  colorBorder: "#2a2a2e",
};

const LIGHT: Tokens = {
  colorPrimary: "#a16207",
  colorBgContainer: "#f8f7f4",
  colorBgElevated: "#ffffff",
  colorText: "#1a1a1c",
  colorTextPlaceholder: "#6d6d72",
  colorBorder: "#e2e1dc",
};

/**
 * Bridges antd's theming to this app's.
 *
 * The site has five accent themes plus light/dark, all expressed as CSS variables, and the
 * mode toggle flips a class on <html> without reloading. Rather than duplicating those
 * palettes here, we read the computed variables and re-read them whenever the class or
 * data-theme attribute changes, so antd follows the site automatically.
 */
export function AntdProvider({ isDark, children }: { isDark: boolean; children: React.ReactNode }) {
  const { lang } = useTranslation();
  // One piece of state, so the algorithm and the surface colours can never disagree — that
  // mismatch is exactly what turned the picker black on a light-mode load.
  const [theme, setTheme] = useState(() => ({ dark: isDark, tokens: isDark ? DARK : LIGHT }));

  useEffect(() => {
    const root = document.documentElement;
    const read = () => {
      const cs = getComputedStyle(root);
      const isNowDark = root.classList.contains("dark");
      const seed = isNowDark ? DARK : LIGHT;
      const v = (name: string, fallback: string) => cs.getPropertyValue(name).trim() || fallback;
      setTheme({
        dark: isNowDark,
        tokens: {
          colorPrimary: v("--primary", seed.colorPrimary),
          colorBgContainer: v("--surface-2", seed.colorBgContainer),
          colorBgElevated: v("--card", seed.colorBgElevated),
          colorText: v("--foreground", seed.colorText),
          colorTextPlaceholder: v("--muted-foreground", seed.colorTextPlaceholder),
          colorBorder: v("--border", seed.colorBorder),
        },
      });
    };
    read();
    const observer = new MutationObserver(read);
    observer.observe(root, { attributes: true, attributeFilter: ["class", "data-theme"] });
    return () => observer.disconnect();
  }, []);

  return (
    <ConfigProvider
      locale={lang === "en" ? enUS : bnBD}
      theme={{
        algorithm: theme.dark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          ...theme.tokens,
          // Match the app's own controls rather than antd's defaults.
          borderRadius: 10,
          controlHeight: 40,
          fontFamily: "inherit",
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}
