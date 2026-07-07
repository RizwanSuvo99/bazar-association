"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, X, Loader2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n-context";
import { Input, Select } from "@/components/ui";
import type { Facets } from "@/lib/types";

export function SearchFilterBar({ facets }: { facets: Facets }) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(params.get("q") ?? "");

  const current = (key: string) => params.get(key) ?? "";

  function navigate(next: Record<string, string>) {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v) sp.set(k, v);
      else sp.delete(k);
    }
    sp.delete("page");
    startTransition(() => router.replace(`${pathname}?${sp.toString()}`, { scroll: false }));
  }

  // Debounce the free-text search.
  useEffect(() => {
    const id = setTimeout(() => {
      if ((params.get("q") ?? "") !== q) navigate({ q });
    }, 350);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const hasFilters = ["q", "business_type", "market", "ward"].some((k) => current(k));

  function clearAll() {
    setQ("");
    startTransition(() => router.replace(pathname, { scroll: false }));
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-card p-4 shadow-sm">
      <div className="relative">
        {pending ? (
          <Loader2 className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-muted-foreground" />
        ) : (
          <Search className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        )}
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("home.searchPlaceholder")}
          className="h-12 pl-11 pr-10"
        />
        {q && (
          <button
            onClick={() => setQ("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            aria-label="clear"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <Select value={current("business_type")} onChange={(e) => navigate({ business_type: e.target.value })}>
          <option value="">{t("home.filterByType")}</option>
          {facets.business_types.map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </Select>
        <Select value={current("market")} onChange={(e) => navigate({ market: e.target.value })}>
          <option value="">{t("home.filterByMarket")}</option>
          {facets.markets.map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </Select>
        <Select value={current("ward")} onChange={(e) => navigate({ ward: e.target.value })}>
          <option value="">{t("home.filterByWard")}</option>
          {facets.wards.map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </Select>
      </div>

      {hasFilters && (
        <button
          onClick={clearAll}
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline cursor-pointer"
        >
          <X className="h-3.5 w-3.5" />
          {t("common.clearAll")}
        </button>
      )}
    </div>
  );
}
