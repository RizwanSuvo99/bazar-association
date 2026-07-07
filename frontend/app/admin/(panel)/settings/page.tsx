import { getSettings } from "@/lib/queries";
import { getI18n } from "@/lib/i18n-server";
import { SettingsForm } from "@/components/admin/settings-form";

export default async function AdminSettingsPage() {
  const { dict } = await getI18n();
  const settings = await getSettings();

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h1 className="font-display text-2xl font-bold text-foreground">{dict.admin.settings}</h1>
      <SettingsForm settings={settings} />
    </div>
  );
}
