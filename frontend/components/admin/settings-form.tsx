"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Save, Check, Palette, Wallet, Building2, Images } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";
import { bustCache } from "@/lib/revalidate";
import { useTranslation } from "@/lib/i18n-context";
import { Input, Button, Label, Card } from "@/components/ui";
import { ThemeSwitcher } from "./theme-switcher";
import { HeroImagesManager } from "./hero-images-manager";
import type { HeroImage, SiteSettings, ThemeName } from "@/lib/types";

export function SettingsForm({ settings }: { settings: SiteSettings }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({ defaultValues: settings });
  const [theme, setTheme] = useState<ThemeName>(settings.active_theme);
  const [heroImages, setHeroImages] = useState<HeroImage[]>(settings.hero_images ?? []);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(v: SiteSettings) {
    setError("");
    setSaved(false);
    try {
      await apiFetch("/admin/settings", { method: "PUT", json: { ...v, active_theme: theme, hero_images: heroImages } });
      await bustCache("settings");
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      if (e instanceof ApiError && e.details?.length) setError(e.details.map((d) => d.message).join(" "));
      else setError(e instanceof ApiError ? e.message : "সংরক্ষণ ব্যর্থ হয়েছে।");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <Card className="p-6">
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold">
          <Palette className="h-5 w-5 text-primary" /> {t("admin.theme")}
        </h2>
        <ThemeSwitcher value={theme} onChange={setTheme} />
      </Card>

      <Card className="p-6">
        <h2 className="mb-1 flex items-center gap-2 font-display text-lg font-semibold">
          <Images className="h-5 w-5 text-primary" /> হিরো ছবি (কারুসেল)
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">হোম পেজের কভার ছবি — একাধিক ছবি যোগ করলে কারুসেল হবে।</p>
        <HeroImagesManager value={heroImages} onChange={setHeroImages} />
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold">
          <Wallet className="h-5 w-5 text-primary" /> {t("register.sectionPayment")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>{t("register.bkashNumber")}</Label>
            <Input inputMode="numeric" {...register("bkash_number")} />
          </div>
          <div>
            <Label>{t("register.feeLabel")} (৳)</Label>
            <Input type="number" {...register("registration_fee")} />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold">
          <Building2 className="h-5 w-5 text-primary" /> সংস্থার তথ্য / Organization
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label>নাম (বাংলা)</Label><Input {...register("org_name_bn")} /></div>
          <div><Label>Name (English)</Label><Input {...register("org_name_en")} /></div>
          <div><Label>{t("contact.phone")}</Label><Input {...register("contact_phone")} /></div>
          <div><Label>{t("contact.email")}</Label><Input type="email" {...register("contact_email")} /></div>
          <div><Label>ঠিকানা (বাংলা)</Label><Input {...register("contact_address_bn")} /></div>
          <div><Label>Address (English)</Label><Input {...register("contact_address_en")} /></div>
          <div className="sm:col-span-2"><Label>Facebook URL</Label><Input {...register("facebook_url")} /></div>
        </div>
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
