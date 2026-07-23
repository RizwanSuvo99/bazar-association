import Link from "next/link";
import { cn } from "@/lib/utils";
import { localizeNumber } from "@/lib/format";
import type { Lang } from "@/lib/types";

/** Windowed page list: all pages when few, otherwise 1 … around-current … last. */
function pageWindow(page: number, totalPages: number): (number | "…")[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages = new Set<number>([1, totalPages, page - 1, page, page + 1]);
  const list = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  let prev = 0;
  for (const p of list) {
    if (p - prev > 1) out.push("…");
    out.push(p);
    prev = p;
  }
  return out;
}

/** Server-friendly, token-styled pagination. Preserves extra query params. */
export function Pagination({
  page,
  totalPages,
  basePath,
  params = {},
  lang,
  prevLabel,
  nextLabel,
  className,
}: {
  page: number;
  totalPages: number;
  basePath: string;
  params?: Record<string, string | undefined>;
  lang: Lang;
  prevLabel: string;
  nextLabel: string;
  className?: string;
}) {
  if (totalPages <= 1) return null;

  const href = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v) sp.set(k, v);
    }
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  return (
    <nav className={cn("flex flex-wrap items-center justify-center gap-1.5", className)}>
      {page > 1 && (
        <Link href={href(page - 1)} className="rounded-lg bg-card px-3.5 py-2 text-sm transition-colors hover:bg-surface-2">
          {prevLabel}
        </Link>
      )}
      {pageWindow(page, totalPages).map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="px-1.5 text-sm text-muted-foreground">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={href(p)}
            className={cn(
              "min-w-10 rounded-lg px-3 py-2 text-center text-sm transition-colors",
              p === page ? "bg-primary font-semibold text-primary-foreground" : "bg-card hover:bg-surface-2",
            )}
          >
            {localizeNumber(p, lang)}
          </Link>
        ),
      )}
      {page < totalPages && (
        <Link href={href(page + 1)} className="rounded-lg bg-card px-3.5 py-2 text-sm transition-colors hover:bg-surface-2">
          {nextLabel}
        </Link>
      )}
    </nav>
  );
}
