import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Hero } from "@/components/public/hero";
import { SearchFilterBar } from "@/components/public/search-filter-bar";
import { ProfileCard } from "@/components/public/profile-card";
import { EmptyState } from "@/components/public/empty-state";
import { getBusinessmen, getFacets, getPage } from "@/lib/queries";
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
  const [list, facets, page] = await Promise.all([
    getBusinessmen(query),
    getFacets().catch(() => emptyFacets),
    getPage("home").catch(() => null as PageContent | null),
  ]);

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
      <Hero title={title} subtitle={subtitle} ctaLabel={cta} memberLine={memberLine} />

      <Container className="py-10">
        <SearchFilterBar facets={facets} />

        <p className="mt-6 text-sm text-muted-foreground">{memberLine}</p>

        {items.length === 0 ? (
          <div className="mt-6">
            <EmptyState />
          </div>
        ) : (
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((b) => (
              <ProfileCard key={b.id} b={b} lang={lang} />
            ))}
          </div>
        )}

        {meta.totalPages > 1 && (
          <nav className="mt-10 flex items-center justify-center gap-1.5">
            {meta.page > 1 && (
              <Link
                href={makeHref(meta.page - 1)}
                className="rounded-lg border border-border bg-card px-3.5 py-2 text-sm hover:bg-muted"
              >
                {translate(dict, "common.previous")}
              </Link>
            )}
            {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={makeHref(p)}
                className={
                  "min-w-10 rounded-lg border px-3 py-2 text-center text-sm " +
                  (p === meta.page
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card hover:bg-muted")
                }
              >
                {localizeNumber(p, lang)}
              </Link>
            ))}
            {meta.page < meta.totalPages && (
              <Link
                href={makeHref(meta.page + 1)}
                className="rounded-lg border border-border bg-card px-3.5 py-2 text-sm hover:bg-muted"
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
