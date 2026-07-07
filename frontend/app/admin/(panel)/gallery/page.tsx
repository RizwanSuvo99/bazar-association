import { getAdminGallery } from "@/lib/admin-queries";
import { getI18n } from "@/lib/i18n-server";
import { GalleryManager } from "@/components/admin/gallery-manager";
import type { GalleryImage } from "@/lib/types";

export default async function AdminGalleryPage() {
  const { dict } = await getI18n();
  const images = await getAdminGallery().catch(() => [] as GalleryImage[]);

  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-bold text-foreground">{dict.admin.gallery}</h1>
      <GalleryManager images={images} />
    </div>
  );
}
