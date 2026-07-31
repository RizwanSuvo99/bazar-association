import { getSession } from "@/lib/auth";
import { PasswordForm } from "@/components/admin/password-form";
import { Card } from "@/components/ui";

export const metadata = { title: "আমার অ্যাকাউন্ট" };

export default async function AdminAccountPage() {
  const admin = await getSession();

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="font-display text-3xl font-bold text-foreground">আমার অ্যাকাউন্ট</h1>

      <Card className="p-6">
        <dl className="grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-muted-foreground">নাম</dt>
            <dd className="mt-0.5 text-sm font-medium">{admin?.name}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">ইমেইল</dt>
            <dd className="mt-0.5 break-all text-sm font-medium">{admin?.email}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">ভূমিকা</dt>
            <dd className="mt-0.5 text-sm font-medium">
              {admin?.role === "superadmin" ? "সুপার অ্যাডমিন" : "অ্যাডমিন"}
            </dd>
          </div>
        </dl>
      </Card>

      <PasswordForm />
    </div>
  );
}
