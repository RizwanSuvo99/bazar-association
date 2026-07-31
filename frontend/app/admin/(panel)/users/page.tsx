import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getAdminUsers } from "@/lib/admin-queries";
import { AdminsManager } from "@/components/admin/admins-manager";
import { Card } from "@/components/ui";
import type { AdminAccount } from "@/lib/types";

export const metadata = { title: "অ্যাডমিন ব্যবস্থাপনা" };

export default async function AdminUsersPage() {
  const admin = await getSession();
  if (!admin) redirect("/admin/login");

  // The API also enforces this; checking here avoids rendering a page that can only 403.
  if (admin.role !== "superadmin") {
    return (
      <div className="mx-auto max-w-2xl">
        <Card className="p-8 text-center">
          <h1 className="font-display text-xl font-bold">প্রবেশাধিকার নেই</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            অ্যাডমিন ব্যবস্থাপনা শুধুমাত্র সুপার অ্যাডমিনদের জন্য।
          </p>
        </Card>
      </div>
    );
  }

  let admins: AdminAccount[] = [];
  try {
    admins = await getAdminUsers();
  } catch {
    admins = [];
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">অ্যাডমিন ব্যবস্থাপনা</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          অ্যাডমিন অ্যাকাউন্ট যোগ করুন, ভূমিকা বদলান বা নিষ্ক্রিয় করুন।
        </p>
      </div>
      <AdminsManager admins={admins} currentAdminId={String(admin.id)} />
    </div>
  );
}
