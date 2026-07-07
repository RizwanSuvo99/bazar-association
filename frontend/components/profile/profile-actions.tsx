"use client";

import { useState } from "react";
import { Printer, Share2, Check } from "lucide-react";
import { useTranslation } from "@/lib/i18n-context";

export function ProfileActions() {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  async function share() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="flex gap-2 print:hidden">
      <button
        onClick={share}
        className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-md)] border border-border bg-card text-sm font-medium hover:bg-muted cursor-pointer"
      >
        {copied ? <Check className="h-4 w-4 text-success" /> : <Share2 className="h-4 w-4" />}
        {copied ? t("common.copied") : t("common.share")}
      </button>
      <button
        onClick={() => window.print()}
        className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] border border-border bg-card hover:bg-muted cursor-pointer"
        aria-label={t("common.print")}
      >
        <Printer className="h-4 w-4" />
      </button>
    </div>
  );
}
