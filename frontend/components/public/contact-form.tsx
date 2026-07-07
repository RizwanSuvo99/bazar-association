"use client";

import { useForm } from "react-hook-form";
import { useState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { useTranslation } from "@/lib/i18n-context";
import { apiFetch, ApiError } from "@/lib/api";
import { Input, Textarea, Button, Label, Card } from "@/components/ui";

interface FormValues {
  name: string;
  email?: string;
  phone?: string;
  subject?: string;
  message: string;
}

export function ContactForm() {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>();
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(values: FormValues) {
    setError("");
    try {
      await apiFetch("/contact-messages", { method: "POST", json: values });
      reset();
      setDone(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "একটি সমস্যা হয়েছে।");
    }
  }

  if (done) {
    return (
      <Card className="flex flex-col items-center p-8 text-center">
        <CheckCircle2 className="h-12 w-12 text-success" />
        <p className="mt-3 font-medium text-foreground">{t("contact.success")}</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => setDone(false)}>
          {t("contact.send")}
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>{t("contact.name")} *</Label>
            <Input {...register("name", { required: true })} aria-invalid={!!errors.name} />
          </div>
          <div>
            <Label>{t("contact.phone")}</Label>
            <Input {...register("phone")} inputMode="numeric" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>{t("contact.email")}</Label>
            <Input type="email" {...register("email")} />
          </div>
          <div>
            <Label>{t("contact.subject")}</Label>
            <Input {...register("subject")} />
          </div>
        </div>
        <div>
          <Label>{t("contact.message")} *</Label>
          <Textarea rows={5} {...register("message", { required: true })} aria-invalid={!!errors.message} />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
          <Send className="h-4 w-4" />
          {isSubmitting ? t("contact.sending") : t("contact.send")}
        </Button>
      </form>
    </Card>
  );
}
