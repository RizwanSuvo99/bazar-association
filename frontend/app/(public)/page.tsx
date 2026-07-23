import Link from "next/link";
import { Container } from "@/components/layout/container";
import { HeroCarousel } from "@/components/public/hero-carousel";
import { SearchFilterBar } from "@/components/public/search-filter-bar";
import { ProfileCard } from "@/components/public/profile-card";
import { EmptyState } from "@/components/public/empty-state";
import { getBusinessmen, getFacets, getPage, getSettings } from "@/lib/queries";
import { getI18n } from "@/lib/i18n-server";
import { translate, localize } from "@/lib/i18n";
import { localizeNumber } from "@/lib/format";
import type { Facets, PageContent } from "@/lib/types";

type SP = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function HomePage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const { lang, dict } = await getI18n();

  const query = {
    q: first(sp.q),
    business_type: first(sp.business_type),
    market: first(sp.market),
    ward: first(sp.ward),
    page: first(sp.page) || "1",
    limit: 12,
  };

  const emptyFacets: Facets = { business_types: [], markets: [], wards: [], unions: [] };
  const [list, facets, page, settings] = await Promise.all([
    getBusinessmen(query),
    getFacets().catch(() => emptyFacets),
    getPage("home").catch(() => null as PageContent | null),
    getSettings().catch(() => null),
  ]);
  const heroImages = (settings?.hero_images ?? []).map((h) => h.url).filter(Boolean);

  const title = (page && localize(page, "title", lang)) || translate(dict, "nav.home");
  const subtitle = page ? localize(page, "subtitle", lang) : "";
  const cta =
    (page?.extra?.[`cta_${lang}`] as string) ||
    (page?.extra?.cta_bn as string) ||
    translate(dict, "home.cta");
  const memberLine = translate(dict, "home.resultsCount", { count: localizeNumber(list.meta.total, lang) });

  const makeHref = (p: number) => {
    const params = new URLSearchParams();
    for (const k of ["q", "business_type", "market", "ward"] as const) {
      if (query[k]) params.set(k, query[k] as string);
    }
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/?${qs}` : "/";
  };

  const { items, meta } = list;

  return (
    <>
      <HeroCarousel images={heroImages} title={title} subtitle={subtitle} ctaLabel={cta} memberLine={memberLine} />

      <Container className="py-12">
        <SearchFilterBar facets={facets} />

        {/* Stats band — editorial member count on a surface tile */}
        <div className="mt-6 flex items-baseline gap-3 rounded-2xl bg-card px-6 py-4">
          <span className="font-display text-3xl font-bold tabular-nums text-primary">
            {localizeNumber(list.meta.total, lang)}
          </span>
          <span className="text-sm text-muted-foreground">{memberLine}</span>
        </div>

        {items.length === 0 ? (
          <div className="mt-6">
            <EmptyState />
          </div>
        ) : (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((b) => (
              <ProfileCard key={b.id} b={b} lang={lang} />
            ))}
          </div>
        )}

        {meta.totalPages > 1 && (
          <nav className="mt-12 flex items-center justify-center gap-1.5">
            {meta.page > 1 && (
              <Link
                href={makeHref(meta.page - 1)}
                className="rounded-lg bg-card px-3.5 py-2 text-sm transition-colors hover:bg-surface-2"
              >
                {translate(dict, "common.previous")}
              </Link>
            )}
            {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={makeHref(p)}
                className={
                  "min-w-10 rounded-lg px-3 py-2 text-center text-sm transition-colors " +
                  (p === meta.page
                    ? "bg-primary font-semibold text-primary-foreground"
                    : "bg-card hover:bg-surface-2")
                }
              >
                {localizeNumber(p, lang)}
              </Link>
            ))}
            {meta.page < meta.totalPages && (
              <Link
                href={makeHref(meta.page + 1)}
                className="rounded-lg bg-card px-3.5 py-2 text-sm transition-colors hover:bg-surface-2"
              >
                {translate(dict, "common.next")}
              </Link>
            )}
          </nav>
        )}
      </Container>
    </>
  );
}
