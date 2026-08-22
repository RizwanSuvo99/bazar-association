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

const FALLBACK: Tokens = {
  colorPrimary: "#f0b429",
  colorBgContainer: "#232327",
  colorBgElevated: "#1c1c1f",
  colorText: "#f2f2f2",
  colorTextPlaceholder: "#a0a0a5",
  colorBorder: "#2a2a2e",
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
  // Seeded from the server-rendered mode so the input is not briefly light on a dark panel.
  const [dark, setDark] = useState(isDark);
  const [tokens, setTokens] = useState<Tokens>(FALLBACK);

  useEffect(() => {
    const root = document.documentElement;
    const read = () => {
      const cs = getComputedStyle(root);
      const v = (name: string, fallback: string) => cs.getPropertyValue(name).trim() || fallback;
      setDark(root.classList.contains("dark"));
      setTokens({
        colorPrimary: v("--primary", FALLBACK.colorPrimary),
        colorBgContainer: v("--surface-2", FALLBACK.colorBgContainer),
        colorBgElevated: v("--card", FALLBACK.colorBgElevated),
        colorText: v("--foreground", FALLBACK.colorText),
        colorTextPlaceholder: v("--muted-foreground", FALLBACK.colorTextPlaceholder),
        colorBorder: v("--border", FALLBACK.colorBorder),
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
        algorithm: dark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          ...tokens,
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
