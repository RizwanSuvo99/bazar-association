import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getI18n } from "@/lib/i18n-server";
import { BusinessmanForm } from "@/components/admin/businessman-form";

export default async function NewBusinessmanPage() {
  const { dict } = await getI18n();
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href="/admin/businessmen" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> {dict.admin.members}
      </Link>
      <h1 className="font-display text-2xl font-bold text-foreground">{dict.admin.addMember}</h1>
      <BusinessmanForm />
    </div>
  );
}
