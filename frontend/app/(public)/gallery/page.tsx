import { PageHeader } from "@/components/public/page-header";
import { Container } from "@/components/layout/container";
import { GalleryGrid } from "@/components/public/gallery-grid";
import { EmptyState } from "@/components/public/empty-state";
import { getGallery } from "@/lib/queries";
import { Pagination } from "@/components/pagination";
import { getI18n } from "@/lib/i18n-server";
import type { GalleryImage } from "@/lib/types";

export const metadata = { title: "গ্যালারি" };

type SP = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function GalleryPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const page = first(sp.page) || "1";
  const { lang, dict } = await getI18n();
  const { items: images, meta } = await getGallery(page).catch(
    () => ({ items: [] as GalleryImage[], meta: { page: 1, limit: 24, total: 0, totalPages: 1 } }),
  );

  return (
    <>
      <PageHeader title={dict.nav.gallery} />
      <Container className="py-10">
        {images.length === 0 ? (
          <EmptyState title={dict.gallery.empty} hint="" />
        ) : (
          <GalleryGrid images={images} lang={lang} />
        )}
        <Pagination
          page={meta.page}
          totalPages={meta.totalPages}
          basePath="/gallery"
          lang={lang}
          prevLabel={dict.common.previous}
          nextLabel={dict.common.next}
          className="mt-8"
        />
      </Container>
    </>
  );
}
