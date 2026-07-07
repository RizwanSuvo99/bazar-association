"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Save, Check } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";
import { bustCache } from "@/lib/revalidate";
import { useTranslation } from "@/lib/i18n-context";
import { Input, Textarea, Button, Label, Card } from "@/components/ui";
import type { PageContent } from "@/lib/types";

type Values = Record<string, string>;

function Bilingual({
  label,
  bnProps,
  enProps,
  textarea,
  rows,
}: {
  label: string;
  bnProps: object;
  enProps: object;
  textarea?: boolean;
  rows?: number;
}) {
  const Comp = textarea ? Textarea : Input;
  return (
    <div>
      <Label>{label}</Label>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <span className="mb-1 block text-xs text-muted-foreground">বাংলা</span>
          <Comp rows={rows} {...(bnProps as object)} />
        </div>
        <div>
          <span className="mb-1 block text-xs text-muted-foreground">English</span>
          <Comp rows={rows} {...(enProps as object)} />
        </div>
      </div>
    </div>
  );
}

export function ContentEditor({ page }: { page: PageContent }) {
  const { t } = useTranslation();
  const router = useRouter();
  const extra = (page.extra || {}) as Record<string, string>;
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<Values>({
    defaultValues: {
      title_bn: page.title_bn || "", title_en: page.title_en || "",
      subtitle_bn: page.subtitle_bn || "", subtitle_en: page.subtitle_en || "",
      body_bn: page.body_bn || "", body_en: page.body_en || "",
      cta_bn: extra.cta_bn || "", cta_en: extra.cta_en || "",
    },
  });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(v: Values) {
    setError("");
    setSaved(false);
    const payload: Record<string, unknown> = {
      title_bn: v.title_bn, title_en: v.title_en,
      subtitle_bn: v.subtitle_bn, subtitle_en: v.subtitle_en,
      body_bn: v.body_bn, body_en: v.body_en,
    };
    if (page.page_key === "home") payload.extra = { ...extra, cta_bn: v.cta_bn, cta_en: v.cta_en };
    try {
      await apiFetch(`/admin/pages/${page.page_key}`, { method: "PUT", json: payload });
      await bustCache("content");
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "সংরক্ষণ ব্যর্থ হয়েছে।");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <Card className="space-y-4 p-6">
        <Bilingual label="শিরোনাম / Title" bnProps={register("title_bn")} enProps={register("title_en")} />
        <Bilingual label="উপশিরোনাম / Subtitle" bnProps={register("subtitle_bn")} enProps={register("subtitle_en")} />
        {page.page_key === "home" && (
          <Bilingual label="বাটন টেক্সট / CTA" bnProps={register("cta_bn")} enProps={register("cta_en")} />
        )}
        <Bilingual label="মূল কন্টেন্ট / Body (Markdown)" bnProps={register("body_bn")} enProps={register("body_en")} textarea rows={10} />
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting}>
          <Save className="h-4 w-4" /> {isSubmitting ? t("common.saving") : t("common.save")}
        </Button>
        {saved && <span className="flex items-center gap-1 text-sm text-success"><Check className="h-4 w-4" /> {t("admin.saved")}</span>}
      </div>
    </form>
  );
}
