"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileSignature,
  Upload,
  Loader2,
  Trash2,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  ExternalLink,
  FileText,
} from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";
import { Button, Card, Badge } from "@/components/ui";
import type { Businessman } from "@/lib/types";

/**
 * Members print the registration form, sign it by hand and hand it back to the office.
 * The admin attaches that scan here and chooses, per member, whether the public token
 * page (the one the ID-card QR opens) shows the signed copy or the generated one.
 */
export function SignedFormManager({ member }: { member: Businessman }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const url = member.signed_form_url ?? null;
  const isPdf = member.signed_form_mime === "application/pdf";
  const visible = member.signed_form_visible !== false;
  const shownPublicly = Boolean(url) && visible;

  function fail(e: unknown, fallback: string) {
    if (e instanceof ApiError && e.details?.length) setError(e.details.map((d) => d.message).join(" "));
    else setError(e instanceof ApiError ? e.message : fallback);
  }

  function flash(msg: string) {
    setNotice(msg);
    setError("");
    setTimeout(() => setNotice(""), 4000);
  }

  async function upload(file: File) {
    setError("");
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      await apiFetch(`/admin/businessmen/${member.id}/signed-form`, { method: "POST", body: fd });
      flash("স্বাক্ষরিত ফরম আপলোড হয়েছে।");
      router.refresh();
    } catch (e) {
      fail(e, "আপলোড ব্যর্থ হয়েছে।");
    } finally {
      setBusy(false);
    }
  }

  async function setVisible(next: boolean) {
    setError("");
    setBusy(true);
    try {
      await apiFetch(`/admin/businessmen/${member.id}/signed-form`, {
        method: "PATCH",
        json: { visible: next },
      });
      flash(next ? "ওয়েবসাইটে স্বাক্ষরিত কপি দেখানো হবে।" : "ওয়েবসাইটে অস্বাক্ষরিত কপি দেখানো হবে।");
      router.refresh();
    } catch (e) {
      fail(e, "পরিবর্তন করা যায়নি।");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm("স্বাক্ষরিত ফরমটি মুছে ফেলতে চান? এটি ফেরানো যাবে না।")) return;
    setError("");
    setBusy(true);
    try {
      await apiFetch(`/admin/businessmen/${member.id}/signed-form`, { method: "DELETE" });
      flash("স্বাক্ষরিত ফরম মুছে ফেলা হয়েছে।");
      router.refresh();
    } catch (e) {
      fail(e, "মুছে ফেলা যায়নি।");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-6">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
          <FileSignature className="h-5 w-5 text-primary" /> স্বাক্ষরিত রেজিস্ট্রেশন ফরম
        </h2>
        {url && (
          <Badge className={shownPublicly ? "bg-primary-soft text-primary" : "bg-muted text-muted-foreground"}>
            {shownPublicly ? "ওয়েবসাইটে দেখানো হচ্ছে" : "লুকানো"}
          </Badge>
        )}
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        সদস্য ফরম ডাউনলোড করে স্বাক্ষর দিয়ে অফিসে জমা দিলে সেই কপির ছবি বা স্ক্যান এখানে আপলোড করুন।
        আপলোড করা থাকলে সদস্যের QR পেজে এই স্বাক্ষরিত কপিই দেখানো হবে — না চাইলে নিচ থেকে বন্ধ করুন,
        তখন স্বয়ংক্রিয় (অস্বাক্ষরিত) ফরমটি দেখানো হবে।
      </p>

      {error && (
        <p className="mb-3 flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </p>
      )}
      {notice && (
        <p className="mb-3 flex items-center gap-2 rounded-lg bg-primary-soft p-3 text-sm text-primary">
          <Check className="h-4 w-4" /> {notice}
        </p>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
          e.target.value = "";
        }}
      />

      {url ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-start gap-4">
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="block w-40 shrink-0 overflow-hidden rounded-lg bg-surface-2"
              title="বড় করে দেখুন"
            >
              {isPdf ? (
                <span className="flex h-28 w-40 flex-col items-center justify-center gap-1 text-muted-foreground">
                  <FileText className="h-7 w-7" />
                  <span className="text-xs">PDF</span>
                </span>
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={url} alt="স্বাক্ষরিত ফরম" className="h-28 w-40 object-cover" />
              )}
            </a>
            <div className="min-w-[12rem] flex-1 space-y-2">
              {member.signed_form_uploaded_at && (
                <p className="text-xs text-muted-foreground">
                  আপলোড: {new Date(member.signed_form_uploaded_at).toLocaleString("bn-BD")}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <a href={url} target="_blank" rel="noreferrer">
                  <Button type="button" variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4" /> দেখুন
                  </Button>
                </a>
                <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => fileRef.current?.click()}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} পরিবর্তন করুন
                </Button>
                <Button type="button" variant="danger" size="sm" disabled={busy} onClick={remove}>
                  <Trash2 className="h-4 w-4" /> মুছুন
                </Button>
              </div>
            </div>
          </div>

          {/* Which copy the public token page shows */}
          <div className="rounded-lg bg-surface-2 p-4">
            <p className="mb-3 text-sm font-medium">ওয়েবসাইটে কোন কপি দেখানো হবে?</p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={visible ? "primary" : "outline"}
                disabled={busy}
                onClick={() => setVisible(true)}
              >
                <Eye className="h-4 w-4" /> স্বাক্ষরিত কপি
              </Button>
              <Button
                type="button"
                size="sm"
                variant={!visible ? "primary" : "outline"}
                disabled={busy}
                onClick={() => setVisible(false)}
              >
                <EyeOff className="h-4 w-4" /> অস্বাক্ষরিত কপি
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border p-6 text-center">
          <p className="mb-3 text-sm text-muted-foreground">
            এখনো কোনো স্বাক্ষরিত কপি আপলোড করা হয়নি — সদস্যের QR পেজে স্বয়ংক্রিয় ফরমটি দেখানো হচ্ছে।
          </p>
          <Button type="button" disabled={busy} onClick={() => fileRef.current?.click()}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {busy ? "আপলোড হচ্ছে…" : "স্বাক্ষরিত ফরম আপলোড করুন"}
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">JPG, PNG, WEBP বা PDF — সর্বোচ্চ ১৫ MB</p>
        </div>
      )}
    </Card>
  );
}
