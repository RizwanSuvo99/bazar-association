"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Save, AlertCircle } from "lucide-react";
import { useTranslation } from "@/lib/i18n-context";
import { apiFetch, ApiError } from "@/lib/api";
import { Input, Select, Textarea, Button, Label, Card } from "@/components/ui";
import { ImageUploader } from "@/components/register/image-uploader";
import type { Businessman } from "@/lib/types";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
type Values = Record<string, string>;

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label} {required && <span className="text-destructive">*</span>}</Label>
      {children}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function BusinessmanForm({ initial }: { initial?: Businessman }) {
  const { t, dict } = useTranslation();
  const F = dict.fields;
  const router = useRouter();
  const isEdit = !!initial;

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<Values>({
    defaultValues: {
      ...(initial as unknown as Values),
      voter_type: initial?.voter_type || "ব্যবসায়ী",
      status: initial?.status || "active",
      profile_photo_url: initial?.profile_photo_url || "",
    },
  });
  const [serverError, setServerError] = useState("");
  const photo = watch("profile_photo_url");

  async function onSubmit(values: Values) {
    setServerError("");
    try {
      if (isEdit) {
        await apiFetch(`/admin/businessmen/${initial!.id}`, { method: "PATCH", json: values });
      } else {
        await apiFetch("/admin/businessmen", { method: "POST", json: values });
      }
      router.push("/admin/businessmen");
      router.refresh();
    } catch (e) {
      if (e instanceof ApiError && e.details?.length) setServerError(e.details.map((d) => d.message).join(" "));
      else setServerError(e instanceof ApiError ? e.message : "সংরক্ষণ ব্যর্থ হয়েছে।");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card className="p-6">
        <h2 className="mb-4 font-display text-lg font-semibold">{F.profile_photo}</h2>
        <input type="hidden" {...register("profile_photo_url")} />
        <ImageUploader value={photo} endpoint="/admin/uploads/image?folder=profiles" onChange={(url) => setValue("profile_photo_url", url)} size={120} />
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 font-display text-lg font-semibold">{t("register.sectionPersonal")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={F.full_name} required error={errors.full_name && "আবশ্যক"}>
            <Input {...register("full_name", { required: true })} />
          </Field>
          <Field label={F.mobile_number} required error={errors.mobile_number && "সঠিক নম্বর দিন"}>
            <Input inputMode="numeric" {...register("mobile_number", { required: true, pattern: /^01[3-9]\d{8}$/ })} />
          </Field>
          <Field label={F.father_name}><Input {...register("father_name")} /></Field>
          <Field label={F.mother_name}><Input {...register("mother_name")} /></Field>
          <Field label={F.blood_group}>
            <Select {...register("blood_group")}>
              <option value="">—</option>
              {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
            </Select>
          </Field>
          <Field label="স্ট্যাটাস / Status">
            <Select {...register("status")}>
              <option value="active">সক্রিয় / Active</option>
              <option value="inactive">নিষ্ক্রিয় / Inactive</option>
            </Select>
          </Field>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 font-display text-lg font-semibold">{t("register.sectionAddress")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={F.village}><Input {...register("village")} /></Field>
          <Field label={F.post_office}><Input {...register("post_office")} /></Field>
          <Field label={F.municipality_or_union}><Input {...register("municipality_or_union")} /></Field>
          <Field label={F.upazila}><Input {...register("upazila")} /></Field>
          <Field label={F.district}><Input {...register("district")} /></Field>
          <Field label={F.ward_no}><Input {...register("ward_no")} /></Field>
          <Field label={F.holding_no}><Input {...register("holding_no")} /></Field>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 font-display text-lg font-semibold">{t("register.sectionBusiness")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={F.business_type}><Input {...register("business_type")} /></Field>
          <Field label={F.market_name}><Input {...register("market_name")} /></Field>
          <div className="sm:col-span-2">
            <Field label={F.current_business_name_address}><Textarea rows={2} {...register("current_business_name_address")} /></Field>
          </div>
          <Field label={F.owner_name}><Input {...register("owner_name")} /></Field>
          <Field label={F.trade_license_no}><Input {...register("trade_license_no")} /></Field>
          <Field label={F.tin_no}><Input {...register("tin_no")} /></Field>
          <Field label={F.nid_no} required error={errors.nid_no && "সঠিক এনআইডি (১০/১৩/১৭ সংখ্যা)"}>
            <Input inputMode="numeric" {...register("nid_no", { required: true, pattern: /^(\d{10}|\d{13}|\d{17})$/ })} />
          </Field>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 font-display text-lg font-semibold">{t("register.sectionNominee")}</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={F.nominee_name}><Input {...register("nominee_name")} /></Field>
          <Field label={F.nominee_relation}><Input {...register("nominee_relation")} /></Field>
          <Field label={F.nominee_mobile}><Input inputMode="numeric" {...register("nominee_mobile")} /></Field>
        </div>
      </Card>

      {serverError && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> <span>{serverError}</span>
        </div>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          <Save className="h-4 w-4" /> {isSubmitting ? t("common.saving") : t("common.save")}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>{t("common.cancel")}</Button>
      </div>
    </form>
  );
}
