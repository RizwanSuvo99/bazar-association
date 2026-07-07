"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2 } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";
import { useTranslation } from "@/lib/i18n-context";
import { Button, Textarea } from "@/components/ui";

export function RequestActions({ id, status }: { id: number | string; status: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const [busy, setBusy] = useState<"" | "approve" | "reject">("");
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  async function approve() {
    setBusy("approve");
    setError("");
    try {
      await apiFetch(`/admin/registration-requests/${id}/approve`, { method: "POST" });
      router.push("/admin/requests");
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "ত্রুটি হয়েছে।");
      setBusy("");
    }
  }

  async function reject() {
    setBusy("reject");
    setError("");
    try {
      await apiFetch(`/admin/registration-requests/${id}/reject`, { method: "POST", json: { reason } });
      router.push("/admin/requests");
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "ত্রুটি হয়েছে।");
      setBusy("");
    }
  }

  if (status !== "pending") {
    return (
      <p className="rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
        এই আবেদনটি ইতিমধ্যে {status === "approved" ? t("admin.approved") : t("admin.rejected")}।
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-destructive">{error}</p>}
      {rejecting ? (
        <div className="space-y-2">
          <Textarea
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="প্রত্যাখ্যানের কারণ (ঐচ্ছিক)"
          />
          <div className="flex gap-2">
            <Button variant="danger" onClick={reject} disabled={busy === "reject"}>
              {busy === "reject" ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
              {t("admin.reject")}
            </Button>
            <Button variant="outline" onClick={() => setRejecting(false)}>{t("common.cancel")}</Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-3">
          <Button onClick={approve} disabled={busy === "approve"}>
            {busy === "approve" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {t("admin.approve")}
          </Button>
          <Button variant="outline" onClick={() => setRejecting(true)}>
            <X className="h-4 w-4" /> {t("admin.reject")}
          </Button>
        </div>
      )}
    </div>
  );
}
