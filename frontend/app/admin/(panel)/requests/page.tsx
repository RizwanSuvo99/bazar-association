import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getAdminRequests } from "@/lib/admin-queries";
import { getI18n } from "@/lib/i18n-server";
import { Pagination } from "@/components/pagination";
import { Card, Badge } from "@/components/ui";

type SP = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-warning/15 text-warning",
  approved: "bg-success/10 text-success",
  rejected: "bg-destructive/10 text-destructive",
};

export default async function RequestsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const status = first(sp.status);
  const page = first(sp.page) || "1";
  const { lang, dict } = await getI18n();
  const { items: requests, meta } = await getAdminRequests(status, page);

  const tabs = [
    { key: "", label: dict.common.all },
    { key: "pending", label: dict.admin.pending },
    { key: "approved", label: dict.admin.approved },
    { key: "rejected", label: dict.admin.rejected },
  ];
  const statusLabel = (s: string) =>
    s === "pending" ? dict.admin.pending : s === "approved" ? dict.admin.approved : dict.admin.rejected;

  return (
    <div className="space-y-5">
      <h1 className="font-display text-3xl font-bold text-foreground">{dict.admin.requests}</h1>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={tab.key ? `/admin/requests?status=${tab.key}` : "/admin/requests"}
            className={
              "rounded-full px-4 py-1.5 text-sm transition-colors " +
              ((status || "") === tab.key
                ? "bg-primary font-semibold text-primary-foreground"
                : "bg-card hover:bg-surface-2")
            }
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <Card className="divide-y divide-border">
        {requests.length === 0 && <p className="p-10 text-center text-muted-foreground">—</p>}
        {requests.map((r) => (
          <Link key={r.id} href={`/admin/requests/${r.id}`} className="flex items-center justify-between gap-4 p-4 hover:bg-muted/40">
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground">{r.full_name}</p>
              <p className="truncate text-sm text-muted-foreground">
                {r.business_type} · {r.market_name} ·{" "}
                {r.payment_method === "cash" ? dict.register.payCash : `TrxID: ${r.transaction_id}`}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <Badge className={STATUS_STYLE[r.status]}>{statusLabel(r.status)}</Badge>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </Link>
        ))}
      </Card>

      <Pagination
        page={meta.page}
        totalPages={meta.totalPages}
        basePath="/admin/requests"
        params={{ status: status || undefined }}
        lang={lang}
        prevLabel={dict.common.previous}
        nextLabel={dict.common.next}
      />
    </div>
  );
}
