"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Moon, Sun, Languages } from "lucide-react";
import { useTranslation } from "@/lib/i18n-context";
import { cn } from "@/lib/utils";

const iconBtn =
  "inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-muted cursor-pointer";

export function ThemeModeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
    setMounted(true);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    document.cookie = `mode=${next ? "dark" : "light"};path=/;max-age=31536000;samesite=lax`;
  }

  return (
    <button onClick={toggle} className={iconBtn} aria-label="toggle theme" suppressHydrationWarning>
      {mounted && dark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
    </button>
  );
}

export function LangToggle({ className }: { className?: string }) {
  const { lang } = useTranslation();
  const router = useRouter();
  const [, startTransition] = useTransition();

  function switchLang() {
    const next = lang === "bn" ? "en" : "bn";
    document.cookie = `lang=${next};path=/;max-age=31536000;samesite=lax`;
    startTransition(() => router.refresh());
  }

  return (
    <button
      onClick={switchLang}
      className={cn(
        "inline-flex h-10 items-center gap-1.5 rounded-full border border-border bg-card px-3.5 text-sm font-medium text-foreground transition-colors hover:bg-muted cursor-pointer",
        className,
      )}
      aria-label="switch language"
    >
      <Languages className="h-4 w-4" />
      {lang === "bn" ? "EN" : "বাংলা"}
    </button>
  );
}
