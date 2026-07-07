import { getAdminNotices } from "@/lib/admin-queries";
import { getI18n } from "@/lib/i18n-server";
import { NoticesManager } from "@/components/admin/notices-manager";
import type { Notice } from "@/lib/types";

export default async function AdminNoticesPage() {
  const { dict } = await getI18n();
  const notices = await getAdminNotices().catch(() => [] as Notice[]);

  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-bold text-foreground">{dict.admin.notices}</h1>
      <NoticesManager notices={notices} />
    </div>
  );
}
