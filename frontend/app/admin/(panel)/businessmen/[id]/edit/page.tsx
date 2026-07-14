import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileDown, IdCard } from "lucide-react";
import { getI18n } from "@/lib/i18n-server";
import { getAdminBusinessman } from "@/lib/admin-queries";
import { BusinessmanForm } from "@/components/admin/businessman-form";
import { Button } from "@/components/ui";
import type { Businessman } from "@/lib/types";

export default async function EditBusinessmanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { dict } = await getI18n();
  let b: Businessman | null = null;
  try {
    b = await getAdminBusinessman(id);
  } catch {
    b = null;
  }
  if (!b) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href="/admin/businessmen" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> {dict.admin.members}
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-foreground">
          {dict.admin.edit}: {b.full_name} <span className="text-base font-normal text-muted-foreground">{b.unique_id}</span>
        </h1>
        <div className="flex flex-wrap gap-2">
          <a href={`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/businessmen/${b.id}/id-card.pdf`}>
            <Button variant="outline" size="sm" type="button">
              <IdCard className="h-4 w-4" /> {dict.admin.idCard}
            </Button>
          </a>
          <a href={`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/businessmen/${b.id}/form.pdf`}>
            <Button variant="outline" size="sm" type="button">
              <FileDown className="h-4 w-4" /> রেজিস্ট্রেশন ফরম (PDF)
            </Button>
          </a>
        </div>
      </div>
      <BusinessmanForm initial={b} />
    </div>
  );
}
