import { Container } from "@/components/layout/container";
import { HeroCarousel } from "@/components/public/hero-carousel";
import { SearchFilterBar } from "@/components/public/search-filter-bar";
import { ProfileCard } from "@/components/public/profile-card";
import { EmptyState } from "@/components/public/empty-state";
import { Pagination } from "@/components/pagination";
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
    limit: 8,
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

        <Pagination
          page={meta.page}
          totalPages={meta.totalPages}
          basePath="/"
          params={{
            q: query.q || undefined,
            business_type: query.business_type || undefined,
            market: query.market || undefined,
            ward: query.ward || undefined,
          }}
          lang={lang}
          prevLabel={translate(dict, "common.previous")}
          nextLabel={translate(dict, "common.next")}
          className="mt-12"
        />
      </Container>
    </>
  );
}
