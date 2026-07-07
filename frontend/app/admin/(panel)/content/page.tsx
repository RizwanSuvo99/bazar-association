import Link from "next/link";
import { FileText, ArrowRight } from "lucide-react";
import { getI18n } from "@/lib/i18n-server";
import { Card } from "@/components/ui";

const PAGES = [
  { key: "home", bn: "হোম পেজ", en: "Home page" },
  { key: "about", bn: "পরিচিতি", en: "About Us" },
  { key: "rules", bn: "নিয়মকানুন", en: "Rules" },
  { key: "contact", bn: "যোগাযোগ", en: "Contact" },
];

export default async function ContentListPage() {
  const { lang, dict } = await getI18n();
  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-bold text-foreground">{dict.admin.content}</h1>
      <div className="grid gap-3 sm:grid-cols-2">
        {PAGES.map((p) => (
          <Link key={p.key} href={`/admin/content/${p.key}`}>
            <Card className="flex items-center justify-between p-5 transition-colors hover:border-primary/50">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <FileText className="h-5 w-5" />
                </span>
                <span className="font-medium text-foreground">{lang === "en" ? p.en : p.bn}</span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
