import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/layout/container";
import { HeroCarousel } from "@/components/public/hero-carousel";
import { ProfileCard } from "@/components/public/profile-card";
import { EmptyState } from "@/components/public/empty-state";
import { Button } from "@/components/ui";
import { getBusinessmen, getPage, getSettings } from "@/lib/queries";
import { getI18n } from "@/lib/i18n-server";
import { translate, localize } from "@/lib/i18n";
import { localizeNumber } from "@/lib/format";
import type { PageContent } from "@/lib/types";

/** How many of the newest members the landing page previews. The full, searchable
 *  directory lives at /members. */
const PREVIEW_COUNT = 10;

export default async function HomePage() {
  const { lang, dict } = await getI18n();

  // No filters and no pagination here — this is a landing page. `meta.total` is still the
  // count of ALL members (the API counts before LIMIT), so the stats band stays accurate.
  const [list, page, settings] = await Promise.all([
    getBusinessmen({ page: 1, limit: PREVIEW_COUNT }).catch(() => ({
      items: [],
      meta: { page: 1, limit: PREVIEW_COUNT, total: 0, totalPages: 1 },
    })),
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
  const memberLine = translate(dict, "home.memberCount", {
    count: localizeNumber(list.meta.total, lang),
  });

  const { items } = list;

  return (
    <>
      <HeroCarousel images={heroImages} title={title} subtitle={subtitle} ctaLabel={cta} memberLine={memberLine} />

      <Container className="py-12">
        {/* Stats band — editorial member count on a surface tile */}
        <div className="flex items-baseline gap-3 rounded-2xl bg-card px-6 py-4">
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
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {items.map((b) => (
              <ProfileCard key={b.id} b={b} lang={lang} />
            ))}
          </div>
        )}

        <div className="mt-12 flex justify-center">
          <Link href="/members">
            <Button size="lg">
              {translate(dict, "home.allMembers")} <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </Container>
    </>
  );
}
