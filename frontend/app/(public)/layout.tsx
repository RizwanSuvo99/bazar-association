import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { getSettings } from "@/lib/queries";
import { getLang } from "@/lib/i18n-server";
import type { SiteSettings } from "@/lib/types";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  let settings: SiteSettings | null = null;
  try {
    settings = await getSettings();
  } catch {
    settings = null;
  }
  const orgName = settings
    ? lang === "en"
      ? settings.org_name_en
      : settings.org_name_bn
    : "নাঙ্গলকোট বাজার ব্যবসায়ী সংস্থা";

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar orgName={orgName} />
      <main className="flex-1">{children}</main>
      <Footer settings={settings} />
    </div>
  );
}
