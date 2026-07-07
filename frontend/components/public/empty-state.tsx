"use client";

import { Store } from "lucide-react";
import { useTranslation } from "@/lib/i18n-context";

export function EmptyState({ title, hint }: { title?: string; hint?: string }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-border bg-card px-6 py-16 text-center">
      <div className="relative mb-4 flex h-20 w-24 items-end justify-center">
        {/* A simple closed market stall */}
        <div className="bazar-awning absolute inset-x-0 top-0 h-5 rounded-t-md border border-border" />
        <div className="mt-5 flex h-12 w-16 items-center justify-center rounded-b-md border border-t-0 border-border bg-muted">
          <Store className="h-6 w-6 text-muted-foreground" />
        </div>
      </div>
      <h3 className="font-display text-lg font-semibold text-foreground">{title ?? t("home.empty")}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{hint ?? t("home.emptyHint")}</p>
    </div>
  );
}
