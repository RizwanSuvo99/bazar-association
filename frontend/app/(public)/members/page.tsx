import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/public/page-header";
import { SearchFilterBar } from "@/components/public/search-filter-bar";
import { ProfileCard } from "@/components/public/profile-card";
import { EmptyState } from "@/components/public/empty-state";
import { Pagination } from "@/components/pagination";
import { getBusinessmen, getFacets } from "@/lib/queries";
import { getI18n } from "@/lib/i18n-server";
import { translate } from "@/lib/i18n";
import { localizeNumber } from "@/lib/format";
import type { Facets, ListMeta } from "@/lib/types";

export const metadata = { title: "সদস্য তালিকা" };

const PER_PAGE = 20;

type SP = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** The full member directory: search, filter and page through every registered member. */
export default async function MembersPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const { lang, dict } = await getI18n();

  const q = first(sp.q);
  const business_type = first(sp.business_type);
  const market = first(sp.market);
  const ward = first(sp.ward);
  // `page` comes straight from a user-editable URL; the API rejects anything below 1 with a
  // 400, and there is no error boundary on this route, so a stray ?page=0 would render a
  // blank 500 page. Normalise before it ever leaves the server.
  const pageNum = Math.max(1, Number.parseInt(first(sp.page), 10) || 1);

  const emptyFacets: Facets = { business_types: [], markets: [], wards: [], unions: [] };
  const emptyMeta: ListMeta = { page: 1, limit: PER_PAGE, total: 0, totalPages: 1 };

  const [list, facets] = await Promise.all([
    getBusinessmen({ q, business_type, market, ward, page: pageNum, limit: PER_PAGE }).catch(() => ({
      items: [],
      meta: emptyMeta,
    })),
    getFacets().catch(() => emptyFacets),
  ]);

  const { items, meta } = list;
  const countLine = translate(dict, "home.resultsCount", {
    count: localizeNumber(meta.total, lang),
  });

  return (
    <>
      <PageHeader title={translate(dict, "members.title")} subtitle={translate(dict, "members.subtitle")} />

      <Container className="py-12">
        <SearchFilterBar facets={facets} />

        <div className="mt-6 flex items-baseline gap-3 rounded-2xl bg-card px-6 py-4">
          <span className="font-display text-3xl font-bold tabular-nums text-primary">
            {localizeNumber(meta.total, lang)}
          </span>
          <span className="text-sm text-muted-foreground">{countLine}</span>
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
          basePath="/members"
          params={{
            q: q || undefined,
            business_type: business_type || undefined,
            market: market || undefined,
            ward: ward || undefined,
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
