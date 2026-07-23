import Link from "next/link";
import {
  Users,
  Inbox,
  MessageSquare,
  Image as ImageIcon,
  ArrowRight,
  UserPlus,
  Megaphone,
  Zap,
} from "lucide-react";
import { getAdminStats, getAdminRequests } from "@/lib/admin-queries";
import { getI18n } from "@/lib/i18n-server";
import { localizeNumber } from "@/lib/format";
import { StatCard } from "@/components/admin/stat-card";
import { Card } from "@/components/ui";

export default async function DashboardPage() {
  const { lang, dict } = await getI18n();
  const stats = await getAdminStats();
  const { items: pending } = await getAdminRequests("pending", 1, 5).catch(() => ({ items: [], meta: { page: 1, limit: 5, total: 0, totalPages: 1 } }));
  const n = (v: number) => localizeNumber(v, lang);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold text-foreground">{dict.admin.dashboard}</h1>

      {/* Bento grid: feature tile (2x2) + stat tiles + quick actions + wide list */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={dict.admin.totalMembers}
          value={n(stats.businessmen.total)}
          icon={Users}
          href="/admin/businessmen"
          className="sm:col-span-2 lg:row-span-2"
          valueClassName="mt-6 text-5xl lg:text-6xl"
        >
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              সক্রিয় {n(stats.businessmen.active)}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              নিষ্ক্রিয় {n(stats.businessmen.inactive)}
            </span>
          </div>
          <span className="mt-auto inline-flex items-center gap-1 pt-6 text-sm font-medium text-primary">
            {dict.common.all} <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </StatCard>

        <StatCard
          label={dict.admin.pendingRequests}
          value={n(stats.requests.pending)}
          icon={Inbox}
          href="/admin/requests"
          valueClassName={stats.requests.pending > 0 ? "text-warning" : undefined}
        />
        <StatCard
          label={dict.admin.unreadMessages}
          value={n(stats.unread_messages)}
          icon={MessageSquare}
          href="/admin/messages"
          valueClassName={stats.unread_messages > 0 ? "text-primary" : undefined}
        />
        <StatCard label={dict.admin.galleryImages} value={n(stats.gallery_count)} icon={ImageIcon} href="/admin/gallery" />

        {/* Quick actions tile */}
        <Card className="flex h-full flex-col p-6">
          <div className="flex items-start justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {dict.admin.dashboard}
            </p>
            <Zap className="h-5 w-5 shrink-0 text-muted-foreground" />
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <Link
              href="/admin/businessmen/new"
              className="inline-flex items-center gap-2 rounded-lg bg-surface-2 px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <UserPlus className="h-4 w-4 text-primary" /> {dict.admin.addMember}
            </Link>
            <Link
              href="/admin/notices"
              className="inline-flex items-center gap-2 rounded-lg bg-surface-2 px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <Megaphone className="h-4 w-4 text-primary" /> {dict.admin.notices}
            </Link>
          </div>
        </Card>

        {/* Recent pending requests — wide tile */}
        <Card className="p-6 sm:col-span-2 lg:col-span-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {dict.admin.pendingRequests}
            </h2>
            <Link href="/admin/requests" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              {dict.common.all} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {pending.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">—</p>
          ) : (
            <ul className="divide-y divide-border/60">
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
    </div>
  );
}
