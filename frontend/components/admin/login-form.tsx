"use client";

import { useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn } from "lucide-react";
import { useTranslation } from "@/lib/i18n-context";
import { apiFetch, ApiError } from "@/lib/api";
import { Input, Button, Label, Card } from "@/components/ui";

export function LoginForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useSearchParams();
  const { register, handleSubmit } = useForm<{ email: string; password: string }>();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(values: { email: string; password: string }) {
    setError("");
    setLoading(true);
    try {
      await apiFetch("/auth/login", { method: "POST", json: values });
      const next = params.get("next") || "/admin";
      router.push(next);
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "লগইন ব্যর্থ হয়েছে।");
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-sm p-8">
      <div className="mb-6 flex flex-col items-center text-center">
        <Image src="/bazar-logo.png" alt="Logo" width={80} height={72} className="h-20 w-auto object-contain" />
        <h1 className="mt-4 font-display text-xl font-bold text-foreground">{t("admin.loginTitle")}</h1>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label>{t("admin.email")}</Label>
          <Input type="email" autoComplete="username" {...register("email", { required: true })} />
        </div>
        <div>
          <Label>{t("admin.password")}</Label>
          <Input type="password" autoComplete="current-password" {...register("password", { required: true })} />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          <LogIn className="h-4 w-4" />
          {loading ? t("admin.loggingIn") : t("admin.login")}
        </Button>
      </form>
    </Card>
  );
}
