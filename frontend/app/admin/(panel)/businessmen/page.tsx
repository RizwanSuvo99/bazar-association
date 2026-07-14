import { Suspense } from "react";
import Link from "next/link";
import { Plus, IdCard } from "lucide-react";
import { getAdminBusinessmen } from "@/lib/admin-queries";
import { getI18n } from "@/lib/i18n-server";
import { BusinessmenTable } from "@/components/admin/businessmen-table";
import { Button } from "@/components/ui";

type SP = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function AdminBusinessmenPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const { dict } = await getI18n();
  const { items, meta } = await getAdminBusinessmen({ q: first(sp.q), page: first(sp.page) || 1 });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-foreground">{dict.admin.members}</h1>
        <div className="flex flex-wrap gap-2">
          <a href={`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/id-cards.pdf`} target="_blank" rel="noopener">
            <Button variant="outline" size="sm"><IdCard className="h-4 w-4" /> {dict.admin.bulkIdCards}</Button>
          </a>
          <Link href="/admin/businessmen/new">
            <Button size="sm"><Plus className="h-4 w-4" /> {dict.admin.addMember}</Button>
          </Link>
        </div>
      </div>
      <Suspense>
        <BusinessmenTable items={items} meta={meta} />
      </Suspense>
    </div>
  );
}
