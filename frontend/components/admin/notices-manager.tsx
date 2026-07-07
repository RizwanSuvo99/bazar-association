"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Upload, Loader2, Trash2, Eye, Plus, Check, X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useTranslation } from "@/lib/i18n-context";
import { Input, Button, Label, Card, Badge } from "@/components/ui";
import type { Notice } from "@/lib/types";

interface Uploaded {
  url: string;
  file_name: string;
  resource_type: string;
}

export function NoticesManager({ notices }: { notices: Notice[] }) {
  const { dict } = useTranslation();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [titleBn, setTitleBn] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [file, setFile] = useState<Uploaded | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function uploadPdf(f: File) {
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", f);
      const res = await apiFetch<Uploaded>("/admin/uploads/pdf", { method: "POST", body: fd });
      setFile({ url: res.data.url, file_name: res.data.file_name, resource_type: res.data.resource_type });
    } catch {
      setError("PDF আপলোড ব্যর্থ হয়েছে।");
    } finally {
      setUploading(false);
    }
  }

  async function add() {
    setError("");
    if (!titleBn.trim()) return setError("নোটিশের শিরোনাম আবশ্যক।");
    if (!file) return setError("PDF ফাইল আবশ্যক।");
    setSaving(true);
    try {
      await apiFetch("/admin/notices", {
        method: "POST",
        json: {
          title_bn: titleBn,
          title_en: titleEn,
          file_url: file.url,
          file_name: file.file_name,
          file_resource_type: file.resource_type,
        },
      });
      setTitleBn("");
      setTitleEn("");
      setFile(null);
      router.refresh();
    } catch {
      setError("সংরক্ষণ ব্যর্থ হয়েছে।");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    await apiFetch(`/admin/notices/${id}`, { method: "DELETE" }).catch(() => {});
    router.refresh();
  }

  async function togglePublish(n: Notice) {
    await apiFetch(`/admin/notices/${n.id}`, { method: "PATCH", json: { is_published: !n.is_published } }).catch(() => {});
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Add new notice */}
      <Card className="space-y-4 p-6">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
          <Plus className="h-5 w-5 text-primary" /> নতুন নোটিশ যোগ করুন
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>শিরোনাম (বাংলা) <span className="text-destructive">*</span></Label>
            <Input value={titleBn} onChange={(e) => setTitleBn(e.target.value)} />
          </div>
          <div>
            <Label>Title (English)</Label>
            <Input value={titleEn} onChange={(e) => setTitleEn(e.target.value)} />
          </div>
        </div>
        <div>
          <Label>PDF ফাইল <span className="text-destructive">*</span></Label>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadPdf(f);
              e.target.value = "";
            }}
          />
          {file ? (
            <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-border bg-muted px-3 py-2 text-sm">
              <FileText className="h-4 w-4 text-destructive" />
              <span className="flex-1 truncate">{file.file_name}</span>
              <button type="button" onClick={() => setFile(null)} className="text-muted-foreground hover:text-destructive cursor-pointer"><X className="h-4 w-4" /></button>
            </div>
          ) : (
            <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? "আপলোড হচ্ছে..." : "PDF নির্বাচন করুন"}
            </Button>
          )}
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button onClick={add} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} যোগ করুন
        </Button>
      </Card>

      {/* Existing notices */}
      <div className="space-y-3">
        {notices.length === 0 && <p className="py-8 text-center text-muted-foreground">—</p>}
        {notices.map((n) => (
          <Card key={n.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                <FileText className="h-5 w-5" />
              </span>
              <div>
                <p className="font-medium text-foreground">{n.title_bn}</p>
                {n.title_en && <p className="text-xs text-muted-foreground">{n.title_en}</p>}
                <p className="mt-0.5 text-xs text-muted-foreground">{n.created_at?.slice(0, 10)}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {n.is_published ? (
                <Badge className="bg-success/10 text-success">প্রকাশিত</Badge>
              ) : (
                <Badge className="bg-muted text-muted-foreground">লুকানো</Badge>
              )}
              <a href={n.file_url} target="_blank" rel="noreferrer" className="rounded-md border border-border p-1.5 hover:bg-muted" aria-label="view"><Eye className="h-4 w-4" /></a>
              <button onClick={() => togglePublish(n)} className="rounded-md border border-border p-1.5 hover:bg-muted cursor-pointer" aria-label="toggle">
                {n.is_published ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
              </button>
              <button onClick={() => remove(n.id)} className="rounded-md border border-border p-1.5 text-destructive hover:bg-destructive/10 cursor-pointer" aria-label="delete"><Trash2 className="h-4 w-4" /></button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
