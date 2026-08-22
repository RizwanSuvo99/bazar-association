"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, Pencil, Trash2, Check, X, FileDown, IdCard } from "lucide-react";
import { useTranslation } from "@/lib/i18n-context";
import { apiFetch } from "@/lib/api";
import { DatePicker } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { Input, Card, Badge, Label, Button } from "@/components/ui";
import { initialsOf } from "@/lib/format";
import type { Businessman, ListMeta } from "@/lib/types";

function RowActions({ b, onDeleted }: { b: Businessman; onDeleted: () => void }) {
  const { t } = useTranslation();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function del() {
    setBusy(true);
    await apiFetch(`/admin/businessmen/${b.id}?hard=true`, { method: "DELETE" }).catch(() => {});
    setBusy(false);
    onDeleted();
  }

  return (
    <div className="flex items-center justify-end gap-1.5">
      {confirming ? (
        <>
          <button onClick={del} disabled={busy} className="rounded-md bg-destructive p-1.5 text-white cursor-pointer" aria-label="confirm">
            <Check className="h-4 w-4" />
          </button>
          <button onClick={() => setConfirming(false)} className="rounded-md bg-surface-2 p-1.5 hover:bg-muted cursor-pointer" aria-label="cancel">
            <X className="h-4 w-4" />
          </button>
        </>
      ) : (
        <>
          <a href={`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/businessmen/${b.id}/id-card.pdf`} className="rounded-md bg-surface-2 p-1.5 hover:bg-muted" aria-label="download id card" title={t("admin.idCard")}>
            <IdCard className="h-4 w-4" />
          </a>
          <a href={`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/businessmen/${b.id}/form.pdf`} className="rounded-md bg-surface-2 p-1.5 hover:bg-muted" aria-label="download form" title="রেজিস্ট্রেশন ফরম (PDF)">
            <FileDown className="h-4 w-4" />
          </a>
          <Link href={`/admin/businessmen/${b.id}/edit`} className="rounded-md bg-surface-2 p-1.5 hover:bg-muted" aria-label="edit">
            <Pencil className="h-4 w-4" />
          </Link>
          <button onClick={() => setConfirming(true)} className="rounded-md bg-surface-2 p-1.5 text-destructive hover:bg-destructive/10 cursor-pointer" aria-label="delete">
            <Trash2 className="h-4 w-4" />
          </button>
        </>
      )}
    </div>
  );
}

dayjs.extend(customParseFormat);

const { RangePicker } = DatePicker;
/** Display format for the picker inputs. */
const DATE_FORMAT = "YYYY-MM-DD";
type RangeValue = [Dayjs | null, Dayjs | null];

/**
 * Serialise for the API, which requires plain Western digits.
 *
 * Deliberately built from the numeric getters rather than `format("YYYY-MM-DD")`: dayjs's
 * Bengali locale carries a postformat hook that rewrites digits, so under that locale
 * format() yields "২০২৬-০৮-২২" and the API rejects it. Going through numbers cannot be
 * changed by whatever locale is active now or later.
 */
function toApiDate(d: Dayjs): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.year()}-${pad(d.month() + 1)}-${pad(d.date())}`;
}

/** yyyy-mm-dd on the association's calendar day, matching how the date filter is evaluated. */
const DHAKA_DAY = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka" });
const addedOn = (iso?: string | null) => (iso ? DHAKA_DAY.format(new Date(iso)) : "—");

export function BusinessmenTable({ items, meta }: { items: Businessman[]; meta: ListMeta }) {
  const { t, dict } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [, startTransition] = useTransition();

  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";
  const hasFilters = Boolean(q || from || to);

  // The URL stays the source of truth; dayjs objects exist only for the picker.
  const range: RangeValue = [from ? dayjs(from, DATE_FORMAT) : null, to ? dayjs(to, DATE_FORMAT) : null];

  /**
   * The picker commits a whole range at once, so unlike the debounced search box this
   * navigates immediately. Dropping `page` is essential: narrowing the range while on page 4
   * would otherwise land on an empty table with no explanation.
   */
  function onRangeChange(values: RangeValue | null) {
    const sp = new URLSearchParams(params.toString());
    const [start, end] = values ?? [null, null];
    if (start) sp.set("from", toApiDate(start));
    else sp.delete("from");
    if (end) sp.set("to", toApiDate(end));
    else sp.delete("to");
    sp.delete("page");
    startTransition(() => router.replace(`${pathname}?${sp.toString()}`));
  }

  function clearFilters() {
    setQ("");
    startTransition(() => router.replace(pathname));
  }

  useEffect(() => {
    const id = setTimeout(() => {
      if ((params.get("q") ?? "") !== q) {
        const sp = new URLSearchParams(params.toString());
        if (q) sp.set("q", q); else sp.delete("q");
        sp.delete("page");
        startTransition(() => router.replace(`${pathname}?${sp.toString()}`));
      }
    }, 350);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-end gap-3 border-b border-border/60 p-3">
        <div className="relative min-w-[14rem] flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={dict.home.searchPlaceholder} className="h-10 pl-9" />
        </div>
        <div>
          <Label className="text-xs">{dict.admin.dateRange}</Label>
          <RangePicker
            value={range}
            onChange={onRangeChange}
            allowEmpty={[true, true]}
            format={DATE_FORMAT}
            placeholder={[dict.admin.addedFrom, dict.admin.addedTo]}
            // The range never extends past today — members cannot be registered in the future.
            disabledDate={(d) => d && d.isAfter(dayjs(), "day")}
            presets={[
              { label: dict.admin.today, value: [dayjs(), dayjs()] },
              { label: dict.admin.last7, value: [dayjs().subtract(6, "day"), dayjs()] },
              { label: dict.admin.last30, value: [dayjs().subtract(29, "day"), dayjs()] },
              { label: dict.admin.thisMonth, value: [dayjs().startOf("month"), dayjs()] },
            ]}
            className="w-[19rem]"
          />
        </div>
        {hasFilters && (
          <Button type="button" variant="outline" size="sm" onClick={clearFilters} className="h-10">
            <X className="h-4 w-4" /> {dict.admin.clearFilters}
          </Button>
        )}
      </div>
      <div className="thin-scroll overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="bg-surface-2 text-left text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              <th className="px-4 py-3 font-medium">{dict.fields.full_name}</th>
              <th className="px-4 py-3 font-medium">{dict.fields.business_type}</th>
              <th className="px-4 py-3 font-medium">{dict.fields.market_name}</th>
              <th className="px-4 py-3 font-medium">{dict.admin.addedOn}</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {items.map((b) => (
              <tr key={b.id} className="border-b border-border/60 last:border-0 hover:bg-surface-2/60">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-primary-soft">
                      {b.profile_photo_url ? (
                        <Image src={b.profile_photo_url} alt="" fill sizes="36px" className="object-cover" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-xs font-bold text-primary">{initialsOf(b.full_name)}</span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{b.full_name}</p>
                      <p className="text-xs text-muted-foreground">{b.unique_id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{b.business_type || "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{b.market_name || "—"}</td>
                <td className="px-4 py-3 tabular-nums text-muted-foreground">{addedOn(b.created_at)}</td>
                <td className="px-4 py-3">
                  {b.status === "active" ? (
                    <Badge className="bg-success/10 text-success">সক্রিয়</Badge>
                  ) : (
                    <Badge className="bg-muted text-muted-foreground">নিষ্ক্রিয়</Badge>
                  )}
                </td>
                <td className="px-4 py-3">
                  <RowActions b={b} onDeleted={() => router.refresh()} />
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">{dict.home.empty}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border p-3 text-sm">
          <span className="text-muted-foreground">
            {dict.common.page} {meta.page}/{meta.totalPages} — {meta.total}
          </span>
          <div className="flex gap-2">
            <PageLink disabled={meta.page <= 1} to={meta.page - 1} label={dict.common.previous} />
            <PageLink disabled={meta.page >= meta.totalPages} to={meta.page + 1} label={dict.common.next} />
          </div>
        </div>
      )}
    </Card>
  );

  function PageLink({ disabled, to, label }: { disabled: boolean; to: number; label: string }) {
    if (disabled) return <span className="rounded-md bg-surface-2 px-3 py-1.5 text-muted-foreground opacity-50">{label}</span>;
    const sp = new URLSearchParams(params.toString());
    sp.set("page", String(to));
    return <Link href={`${pathname}?${sp.toString()}`} className="rounded-md bg-surface-2 px-3 py-1.5 hover:bg-muted">{label}</Link>;
  }
}
