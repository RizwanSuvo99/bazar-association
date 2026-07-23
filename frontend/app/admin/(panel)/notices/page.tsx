import { getAdminNotices } from "@/lib/admin-queries";
import { getI18n } from "@/lib/i18n-server";
import { NoticesManager } from "@/components/admin/notices-manager";
import { Pagination } from "@/components/pagination";
import type { Notice } from "@/lib/types";

type SP = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function AdminNoticesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const page = first(sp.page) || "1";
  const { lang, dict } = await getI18n();
  const { items: notices, meta } = await getAdminNotices(page).catch(
    () => ({ items: [] as Notice[], meta: { page: 1, limit: 15, total: 0, totalPages: 1 } }),
  );

  return (
    <div className="space-y-5">
      <h1 className="font-display text-3xl font-bold text-foreground">{dict.admin.notices}</h1>
      <NoticesManager notices={notices} />
      <Pagination
        page={meta.page}
        totalPages={meta.totalPages}
        basePath="/admin/notices"
        lang={lang}
        prevLabel={dict.common.previous}
        nextLabel={dict.common.next}
      />
    </div>
  );
}
