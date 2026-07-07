"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { CheckCircle2, Copy, Check, Wallet, AlertCircle } from "lucide-react";
import { useTranslation } from "@/lib/i18n-context";
import { apiFetch, ApiError } from "@/lib/api";
import { Input, Select, Textarea, Button, Label, Card } from "@/components/ui";
import { ImageUploader } from "./image-uploader";
import { localizeNumber } from "@/lib/format";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

type FormValues = Record<string, string>;

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function RegistrationForm({ fee, bkashNumber }: { fee: number; bkashNumber: string }) {
  const { t, lang, dict } = useTranslation();
  const F = dict.fields;
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ defaultValues: { profile_photo_url: "", voter_type: "ব্যবসায়ী" } });

  const [serverError, setServerError] = useState("");
  const [done, setDone] = useState(false);
  const [copied, setCopied] = useState(false);
  const photo = watch("profile_photo_url");

  async function onSubmit(values: FormValues) {
    setServerError("");
    try {
      await apiFetch("/registration-requests", { method: "POST", json: values });
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      if (e instanceof ApiError && e.details?.length) {
        setServerError(e.details.map((d) => d.message).join(" "));
      } else {
        setServerError(e instanceof ApiError ? e.message : "একটি সমস্যা হয়েছে। আবার চেষ্টা করুন।");
      }
    }
  }

  function copyBkash() {
    navigator.clipboard.writeText(bkashNumber).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  if (done) {
    return (
      <Card className="mx-auto max-w-lg p-8 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-success" />
        <h2 className="mt-4 font-display text-2xl font-bold text-foreground">{t("register.successTitle")}</h2>
        <p className="mt-2 text-muted-foreground">{t("register.success")}</p>
        <Link href="/" className="mt-6 inline-block">
          <Button variant="primary">{t("register.backHome")}</Button>
        </Link>
      </Card>
    );
  }

  const inputClass = (name: string) => (errors[name] ? "border-destructive" : "");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Photo (required) */}
      <Card className="p-6">
        <h2 className="mb-1 font-display text-lg font-semibold">{F.profile_photo} <span className="text-destructive">*</span></h2>
        <p className="mb-4 text-sm text-muted-foreground">{t("register.photoHelp")}</p>
        <input type="hidden" {...register("profile_photo_url", { required: t("register.photoRequired") })} />
        <ImageUploader value={photo} onChange={(url) => setValue("profile_photo_url", url, { shouldValidate: true })} size={140} />
        {errors.profile_photo_url && (
          <p className="mt-2 text-xs text-destructive">{String(errors.profile_photo_url.message)}</p>
        )}
      </Card>

      {/* Personal */}
      <Card className="p-6">
        <h2 className="mb-4 font-display text-lg font-semibold">{t("register.sectionPersonal")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={F.full_name} required error={errors.full_name && "আবশ্যক"}>
            <Input className={inputClass("full_name")} {...register("full_name", { required: true })} />
          </Field>
          <Field label={F.mobile_number} required error={errors.mobile_number && "সঠিক মোবাইল নম্বর দিন"}>
            <Input inputMode="numeric" placeholder="01XXXXXXXXX" className={inputClass("mobile_number")}
              {...register("mobile_number", { required: true, pattern: /^01[3-9]\d{8}$/ })} />
          </Field>
          <Field label={F.father_name}>
            <Input {...register("father_name")} />
          </Field>
          <Field label={F.mother_name}>
            <Input {...register("mother_name")} />
          </Field>
          <Field label={F.blood_group}>
            <Select {...register("blood_group")}>
              <option value="">—</option>
              {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
            </Select>
          </Field>
          <Field label={F.voter_type}>
            <Input readOnly className="bg-muted" {...register("voter_type")} />
          </Field>
        </div>
      </Card>

      {/* Address */}
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

      {/* Business */}
      <Card className="p-6">
        <h2 className="mb-4 font-display text-lg font-semibold">{t("register.sectionBusiness")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={F.business_type} required error={errors.business_type && "আবশ্যক"}>
            <Input className={inputClass("business_type")} {...register("business_type", { required: true })} />
          </Field>
          <Field label={F.market_name}><Input {...register("market_name")} /></Field>
          <div className="sm:col-span-2">
            <Field label={F.current_business_name_address}>
              <Textarea rows={2} {...register("current_business_name_address")} />
            </Field>
          </div>
          <Field label={F.owner_name}><Input {...register("owner_name")} /></Field>
          <Field label={F.trade_license_no}><Input {...register("trade_license_no")} /></Field>
          <Field label={F.tin_no}><Input {...register("tin_no")} /></Field>
          <Field label={F.nid_no} required error={errors.nid_no && "সঠিক এনআইডি নম্বর দিন (১০/১৩/১৭ সংখ্যা)"}>
            <Input inputMode="numeric" className={inputClass("nid_no")}
              {...register("nid_no", { required: true, pattern: /^(\d{10}|\d{13}|\d{17})$/ })} />
          </Field>
        </div>
      </Card>

      {/* Nominee */}
      <Card className="p-6">
        <h2 className="mb-4 font-display text-lg font-semibold">{t("register.sectionNominee")}</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={F.nominee_name}><Input {...register("nominee_name")} /></Field>
          <Field label={F.nominee_relation}><Input {...register("nominee_relation")} /></Field>
          <Field label={F.nominee_mobile}><Input inputMode="numeric" {...register("nominee_mobile")} /></Field>
        </div>
      </Card>

      {/* Payment */}
      <Card className="overflow-hidden">
        <div className="bazar-awning border-b border-border bg-primary-soft px-6 py-4">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-foreground">
            <Wallet className="h-5 w-5 text-primary" /> {t("register.sectionPayment")}
          </h2>
        </div>
        <div className="p-6">
          <div className="flex flex-wrap items-center gap-4 rounded-lg bg-muted p-4">
            <div>
              <p className="text-xs text-muted-foreground">{t("register.feeLabel")}</p>
              <p className="font-display text-2xl font-bold text-primary">
                {t("register.feeAmount", { amount: localizeNumber(fee, lang) })}
              </p>
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">{t("register.bkashNumber")}</p>
              <div className="flex items-center gap-2">
                <span className="font-display text-lg font-bold text-foreground">{localizeNumber(bkashNumber, lang)}</span>
                <button type="button" onClick={copyBkash} className="text-primary hover:opacity-80 cursor-pointer" aria-label="copy">
                  {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{t("register.bkashInstruction")}</p>
          <div className="mt-4 max-w-sm">
            <Field label={t("register.txnId")} required error={errors.transaction_id && "আবশ্যক"}>
              <Input className={inputClass("transaction_id")} placeholder="TrxID"
                {...register("transaction_id", { required: true, minLength: 4 })} />
            </Field>
            <p className="mt-1 text-xs text-muted-foreground">{t("register.txnHelp")}</p>
          </div>
        </div>
      </Card>

      {serverError && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
        {isSubmitting ? t("register.submitting") : t("register.submit")}
      </Button>
    </form>
  );
}
