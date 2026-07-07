import Link from "next/link";
import { Users, Inbox, MessageSquare, Image as ImageIcon, ArrowRight } from "lucide-react";
import { getAdminStats, getAdminRequests } from "@/lib/admin-queries";
import { getI18n } from "@/lib/i18n-server";
import { localizeNumber } from "@/lib/format";
import { StatCard } from "@/components/admin/stat-card";
import { Card } from "@/components/ui";

export default async function DashboardPage() {
  const { lang, dict } = await getI18n();
  const stats = await getAdminStats();
  const pending = await getAdminRequests("pending").catch(() => []);
  const n = (v: number) => localizeNumber(v, lang);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-foreground">{dict.admin.dashboard}</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={dict.admin.totalMembers} value={n(stats.businessmen.total)} icon={Users} href="/admin/businessmen" />
        <StatCard label={dict.admin.pendingRequests} value={n(stats.requests.pending)} icon={Inbox} href="/admin/requests" />
        <StatCard label={dict.admin.unreadMessages} value={n(stats.unread_messages)} icon={MessageSquare} href="/admin/messages" />
        <StatCard label={dict.admin.galleryImages} value={n(stats.gallery_count)} icon={ImageIcon} href="/admin/gallery" />
      </div>

      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">{dict.admin.pendingRequests}</h2>
          <Link href="/admin/requests" className="flex items-center gap-1 text-sm text-primary hover:underline">
            {dict.common.all} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {pending.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">—</p>
        ) : (
          <ul className="divide-y divide-border">
            {pending.slice(0, 5).map((r) => (
              <li key={r.id}>
                <Link href={`/admin/requests/${r.id}`} className="flex items-center justify-between py-3 hover:opacity-80">
                  <span>
                    <span className="font-medium text-foreground">{r.full_name}</span>
                    <span className="ml-2 text-sm text-muted-foreground">{r.business_type}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
