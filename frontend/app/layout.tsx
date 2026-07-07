import type { Metadata } from "next";
import { Hind_Siliguri, Anek_Bangla } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { getDictionary } from "@/lib/i18n";
import { LanguageProvider } from "@/lib/i18n-context";
import { getSettings } from "@/lib/queries";
import type { Lang, ThemeName } from "@/lib/types";
import { isThemeName } from "@/lib/theme";

const hind = Hind_Siliguri({
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-hind",
  display: "swap",
});

const anek = Anek_Bangla({
  subsets: ["bengali", "latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-anek",
  display: "swap",
});

const noFlashScript = `(function(){try{var m=document.cookie.match(/(?:^|; )mode=(dark|light)/);if(!m){if(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches){document.documentElement.classList.add('dark');}}}catch(e){}})();`;

export async function generateMetadata(): Promise<Metadata> {
  let title = "নাঙ্গলকোট বাজার ব্যবসায়ী সংস্থা";
  let description = "নাঙ্গলকোট বাজারের নিবন্ধিত ব্যবসায়ীদের কেন্দ্রীয় তথ্যভাণ্ডার।";
  try {
    const s = await getSettings();
    title = s.org_name_bn;
    description = `${s.org_name_bn} — ${s.org_name_en}`;
  } catch {
    // backend may be unavailable during build; use defaults
  }
  return {
    title: { default: title, template: `%s | ${title}` },
    description,
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const lang: Lang = cookieStore.get("lang")?.value === "en" ? "en" : "bn";
  const mode = cookieStore.get("mode")?.value;
  const isDark = mode === "dark";

  let theme: ThemeName = "emerald";
  try {
    const settings = await getSettings();
    if (isThemeName(settings.active_theme)) theme = settings.active_theme;
  } catch {
    // ignore — default theme
  }

  const dict = getDictionary(lang);

  return (
    <html
      lang={lang}
      className={isDark ? "dark" : ""}
      data-theme={theme}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashScript }} />
      </head>
      <body className={`${hind.variable} ${anek.variable} min-h-screen`}>
        <LanguageProvider lang={lang} dict={dict}>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
