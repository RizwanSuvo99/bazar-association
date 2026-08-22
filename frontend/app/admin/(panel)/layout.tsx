import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { AntdProvider } from "@/components/admin/antd-provider";
import { getSession } from "@/lib/auth";
import { getAdminStats } from "@/lib/admin-queries";
import { AdminShell } from "@/components/admin/admin-shell";

export const metadata = { title: "অ্যাডমিন" };

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await getSession();
  if (!admin) redirect("/admin/login");

  // Same rule the root layout uses: dark unless the cookie explicitly says light.
  const isDark = (await cookies()).get("mode")?.value !== "light";

  let pending = 0;
  try {
    const stats = await getAdminStats();
    pending = stats.requests.pending;
  } catch {
    pending = 0;
  }

  // antd is mounted only inside the admin panel — the public site never pays for it.
  // AntdRegistry collects the css-in-js styles during SSR so the panel does not flash unstyled.
  return (
    <AntdRegistry>
      <AntdProvider isDark={isDark}>
        <AdminShell adminName={admin.name} adminRole={admin.role} pendingCount={pending}>
          {children}
        </AdminShell>
      </AntdProvider>
    </AntdRegistry>
  );
}
