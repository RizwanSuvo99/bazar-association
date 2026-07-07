import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getI18n } from "@/lib/i18n-server";
import { getAdminBusinessman } from "@/lib/admin-queries";
import { BusinessmanForm } from "@/components/admin/businessman-form";
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
      <h1 className="font-display text-2xl font-bold text-foreground">
        {dict.admin.edit}: {b.full_name} <span className="text-base font-normal text-muted-foreground">{b.unique_id}</span>
      </h1>
      <BusinessmanForm initial={b} />
    </div>
  );
}
