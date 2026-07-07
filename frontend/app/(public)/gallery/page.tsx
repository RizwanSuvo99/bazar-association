import { PageHeader } from "@/components/public/page-header";
import { Container } from "@/components/layout/container";
import { GalleryGrid } from "@/components/public/gallery-grid";
import { EmptyState } from "@/components/public/empty-state";
import { getGallery } from "@/lib/queries";
import { getI18n } from "@/lib/i18n-server";
import type { GalleryImage } from "@/lib/types";

export const metadata = { title: "গ্যালারি" };

export default async function GalleryPage() {
  const { lang, dict } = await getI18n();
  const images = await getGallery().catch(() => [] as GalleryImage[]);

  return (
    <>
      <PageHeader title={dict.nav.gallery} />
      <Container className="py-10">
        {images.length === 0 ? (
          <EmptyState title={dict.gallery.empty} hint="" />
        ) : (
          <GalleryGrid images={images} lang={lang} />
        )}
      </Container>
    </>
  );
}
