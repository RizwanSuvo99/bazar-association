import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, Wallet } from "lucide-react";
import { getI18n } from "@/lib/i18n-server";
import { getAdminRequest } from "@/lib/admin-queries";
import { RequestActions } from "@/components/admin/request-actions";
import { ProfileSection, FieldRow } from "@/components/profile/sections";
import { Card, Badge } from "@/components/ui";
import type { RegistrationRequest } from "@/lib/types";

export default async function RequestReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { dict } = await getI18n();
  let r: RegistrationRequest | null = null;
  try {
    r = await getAdminRequest(id);
  } catch {
    r = null;
  }
  if (!r) notFound();
  const F = dict.fields;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Link href="/admin/requests" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> {dict.admin.requests}
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-foreground">{r.full_name}</h1>
        <Badge>{r.status}</Badge>
      </div>

      <div className="grid gap-5 lg:grid-cols-[16rem_1fr]">
        <div className="space-y-4">
          <Card className="p-4">
            <div className="relative mx-auto aspect-square w-full max-w-[200px] overflow-hidden rounded-xl bg-primary-soft">
              {r.profile_photo_url && <Image src={r.profile_photo_url} alt={r.full_name} fill sizes="200px" className="object-cover" />}
            </div>
          </Card>
          <Card className="p-4">
            <h3 className="mb-2 flex items-center gap-2 font-display font-semibold">
              <Wallet className="h-4 w-4 text-primary" /> {dict.register.sectionPayment}
            </h3>
            <FieldRow label={dict.register.txnId} value={r.transaction_id} />
          </Card>
          <Card className="p-4">
            <h3 className="mb-3 font-display font-semibold">{dict.admin.approve} / {dict.admin.reject}</h3>
            <RequestActions id={r.id} status={r.status} />
            {r.reject_reason && <p className="mt-3 text-sm text-destructive">{r.reject_reason}</p>}
          </Card>
        </div>

        <div className="space-y-5">
          <ProfileSection title={dict.register.sectionPersonal}>
            <FieldRow label={F.full_name} value={r.full_name} />
            <FieldRow label={F.mobile_number} value={r.mobile_number} />
            <FieldRow label={F.father_name} value={r.father_name} />
            <FieldRow label={F.mother_name} value={r.mother_name} />
            <FieldRow label={F.blood_group} value={r.blood_group} />
            <FieldRow label={F.nid_no} value={r.nid_no} />
          </ProfileSection>
          <ProfileSection title={dict.register.sectionAddress}>
            <FieldRow label={F.village} value={r.village} />
            <FieldRow label={F.post_office} value={r.post_office} />
            <FieldRow label={F.municipality_or_union} value={r.municipality_or_union} />
            <FieldRow label={F.upazila} value={r.upazila} />
            <FieldRow label={F.district} value={r.district} />
            <FieldRow label={F.ward_no} value={r.ward_no} />
            <FieldRow label={F.holding_no} value={r.holding_no} />
          </ProfileSection>
          <ProfileSection title={dict.register.sectionBusiness}>
            <FieldRow label={F.current_business_name_address} value={r.current_business_name_address} />
            <FieldRow label={F.business_type} value={r.business_type} />
            <FieldRow label={F.market_name} value={r.market_name} />
            <FieldRow label={F.owner_name} value={r.owner_name} />
            <FieldRow label={F.trade_license_no} value={r.trade_license_no} />
            <FieldRow label={F.tin_no} value={r.tin_no} />
          </ProfileSection>
          <ProfileSection title={dict.register.sectionNominee}>
            <FieldRow label={F.nominee_name} value={r.nominee_name} />
            <FieldRow label={F.nominee_relation} value={r.nominee_relation} />
            <FieldRow label={F.nominee_mobile} value={r.nominee_mobile} />
          </ProfileSection>
        </div>
      </div>
    </div>
  );
}
