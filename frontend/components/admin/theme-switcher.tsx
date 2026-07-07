"use client";

import { Check } from "lucide-react";
import { THEMES } from "@/lib/theme";
import { useTranslation } from "@/lib/i18n-context";
import type { ThemeName } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ThemeSwitcher({ value, onChange }: { value: ThemeName; onChange: (t: ThemeName) => void }) {
  const { lang } = useTranslation();

  function select(name: ThemeName) {
    onChange(name);
    // Live preview across the whole app.
    document.documentElement.dataset.theme = name;
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {THEMES.map((th) => (
        <button
          type="button"
          key={th.name}
          onClick={() => select(th.name)}
          className={cn(
            "flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all cursor-pointer",
            value === th.name ? "border-primary ring-2 ring-primary" : "border-border hover:border-primary/40",
          )}
        >
          <span className="flex gap-0.5">
            <span className="h-7 w-4 rounded-l-full" style={{ background: th.swatch }} />
            <span className="h-7 w-4 rounded-r-full" style={{ background: th.accent }} />
          </span>
          <span className="text-sm font-medium text-foreground">{lang === "en" ? th.label_en : th.label_bn}</span>
          {value === th.name && <Check className="ml-auto h-4 w-4 text-primary" />}
        </button>
      ))}
    </div>
  );
}
