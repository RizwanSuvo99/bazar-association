import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getAdminStats } from "@/lib/admin-queries";
import { AdminShell } from "@/components/admin/admin-shell";

export const metadata = { title: "অ্যাডমিন" };

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await getSession();
  if (!admin) redirect("/admin/login");

  let pending = 0;
  try {
    const stats = await getAdminStats();
    pending = stats.requests.pending;
  } catch {
    pending = 0;
  }

  return (
    <AdminShell adminName={admin.name} pendingCount={pending}>
      {children}
    </AdminShell>
  );
}
