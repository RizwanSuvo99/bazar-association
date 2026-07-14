"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, Pencil, Trash2, Check, X, FileDown, IdCard } from "lucide-react";
import { useTranslation } from "@/lib/i18n-context";
import { apiFetch } from "@/lib/api";
import { Input, Card, Badge } from "@/components/ui";
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
          <button onClick={() => setConfirming(false)} className="rounded-md border border-border p-1.5 cursor-pointer" aria-label="cancel">
            <X className="h-4 w-4" />
          </button>
        </>
      ) : (
        <>
          <a href={`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/businessmen/${b.id}/id-card.pdf`} className="rounded-md border border-border p-1.5 hover:bg-muted" aria-label="download id card" title={t("admin.idCard")}>
            <IdCard className="h-4 w-4" />
          </a>
          <a href={`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/businessmen/${b.id}/form.pdf`} className="rounded-md border border-border p-1.5 hover:bg-muted" aria-label="download form" title="রেজিস্ট্রেশন ফরম (PDF)">
            <FileDown className="h-4 w-4" />
          </a>
          <Link href={`/admin/businessmen/${b.id}/edit`} className="rounded-md border border-border p-1.5 hover:bg-muted" aria-label="edit">
            <Pencil className="h-4 w-4" />
          </Link>
          <button onClick={() => setConfirming(true)} className="rounded-md border border-border p-1.5 text-destructive hover:bg-destructive/10 cursor-pointer" aria-label="delete">
            <Trash2 className="h-4 w-4" />
          </button>
        </>
      )}
    </div>
  );
}

export function BusinessmenTable({ items, meta }: { items: Businessman[]; meta: ListMeta }) {
  const { t, dict } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [, startTransition] = useTransition();

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
      <div className="border-b border-border p-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={dict.home.searchPlaceholder} className="h-10 pl-9" />
        </div>
      </div>
      <div className="thin-scroll overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
              <th className="px-4 py-3 font-medium">{dict.fields.full_name}</th>
              <th className="px-4 py-3 font-medium">{dict.fields.business_type}</th>
              <th className="px-4 py-3 font-medium">{dict.fields.market_name}</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {items.map((b) => (
              <tr key={b.id} className="border-b border-border/60 last:border-0 hover:bg-muted/40">
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
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">{dict.home.empty}</td>
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
    if (disabled) return <span className="rounded-md border border-border px-3 py-1.5 text-muted-foreground opacity-50">{label}</span>;
    const sp = new URLSearchParams(params.toString());
    sp.set("page", String(to));
    return <Link href={`${pathname}?${sp.toString()}`} className="rounded-md border border-border px-3 py-1.5 hover:bg-muted">{label}</Link>;
  }
}
