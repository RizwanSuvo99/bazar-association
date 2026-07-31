"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { KeyRound, Check, Eye, EyeOff, ShieldAlert } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";
import { Input, Button, Label, Card } from "@/components/ui";

interface FormValues {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export function PasswordForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { isSubmitting, errors },
  } = useForm<FormValues>({
    defaultValues: { current_password: "", new_password: "", confirm_password: "" },
  });
  const [show, setShow] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const newPassword = watch("new_password") || "";

  async function onSubmit(values: FormValues) {
    setError("");
    setSaved(false);
    try {
      await apiFetch("/auth/change-password", { method: "POST", json: values });
      setSaved(true);
      reset();
      router.refresh();
      setTimeout(() => setSaved(false), 4000);
    } catch (e) {
      if (e instanceof ApiError && e.details?.length) setError(e.details.map((d) => d.message).join(" "));
      else setError(e instanceof ApiError ? e.message : "পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে।");
    }
  }

  const inputType = show ? "text" : "password";

  return (
    <Card className="p-6">
      <h2 className="mb-1 flex items-center gap-2 font-display text-lg font-semibold">
        <KeyRound className="h-5 w-5 text-primary" /> পাসওয়ার্ড পরিবর্তন
      </h2>
      <p className="mb-5 text-sm text-muted-foreground">
        পাসওয়ার্ড পরিবর্তন করলে অন্য সব ডিভাইস থেকে স্বয়ংক্রিয়ভাবে লগআউট হয়ে যাবে।
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label>বর্তমান পাসওয়ার্ড</Label>
          <Input
            type={inputType}
            autoComplete="current-password"
            {...register("current_password", { required: "বর্তমান পাসওয়ার্ড আবশ্যক।" })}
          />
          {errors.current_password && (
            <p className="mt-1 text-xs text-destructive">{errors.current_password.message}</p>
          )}
        </div>

        <div>
          <Label>নতুন পাসওয়ার্ড</Label>
          <Input
            type={inputType}
            autoComplete="new-password"
            {...register("new_password", {
              required: "নতুন পাসওয়ার্ড আবশ্যক।",
              minLength: { value: 8, message: "কমপক্ষে ৮ অক্ষর দিন।" },
            })}
          />
          <PasswordHints value={newPassword} />
          {errors.new_password && (
            <p className="mt-1 text-xs text-destructive">{errors.new_password.message}</p>
          )}
        </div>

        <div>
          <Label>নতুন পাসওয়ার্ড (পুনরায়)</Label>
          <Input
            type={inputType}
            autoComplete="new-password"
            {...register("confirm_password", {
              required: "পাসওয়ার্ড নিশ্চিত করুন।",
              validate: (v) => v === newPassword || "দুটি পাসওয়ার্ড মিলছে না।",
            })}
          />
          {errors.confirm_password && (
            <p className="mt-1 text-xs text-destructive">{errors.confirm_password.message}</p>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {show ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড দেখুন"}
        </button>

        {error && (
          <p className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" /> {error}
          </p>
        )}
        {saved && (
          <p className="flex items-center gap-2 rounded-lg bg-primary-soft p-3 text-sm text-primary">
            <Check className="h-4 w-4" /> পাসওয়ার্ড পরিবর্তন হয়েছে।
          </p>
        )}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "সংরক্ষণ হচ্ছে…" : "পাসওয়ার্ড পরিবর্তন করুন"}
        </Button>
      </form>
    </Card>
  );
}

/** Live checklist mirroring the server-side zod rules so failures are visible before submit. */
function PasswordHints({ value }: { value: string }) {
  const rules = [
    { ok: value.length >= 8, label: "কমপক্ষে ৮ অক্ষর" },
    { ok: /[A-Za-z]/.test(value), label: "একটি ইংরেজি অক্ষর" },
    { ok: /[0-9]/.test(value), label: "একটি সংখ্যা" },
  ];
  if (!value) return null;
  return (
    <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
      {rules.map((r) => (
        <li
          key={r.label}
          className={`text-xs ${r.ok ? "text-primary" : "text-muted-foreground"}`}
        >
          {r.ok ? "✔" : "○"} {r.label}
        </li>
      ))}
    </ul>
  );
}
