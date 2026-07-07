import { PageHeader } from "@/components/public/page-header";
import { Container } from "@/components/layout/container";
import { RegistrationForm } from "@/components/register/registration-form";
import { getSettings } from "@/lib/queries";
import { getI18n } from "@/lib/i18n-server";
import type { SiteSettings } from "@/lib/types";

export const metadata = { title: "সদস্য নিবন্ধন" };

export default async function RegisterPage() {
  const { dict } = await getI18n();
  const settings = await getSettings().catch(() => null as SiteSettings | null);
  const fee = settings?.registration_fee ?? 500;
  const bkash = settings?.bkash_number ?? "01700000000";

  return (
    <>
      <PageHeader title={dict.register.title} subtitle={dict.register.subtitle} />
      <Container className="py-10">
        <div className="mx-auto max-w-3xl">
          <RegistrationForm fee={fee} bkashNumber={bkash} />
        </div>
      </Container>
    </>
  );
}
