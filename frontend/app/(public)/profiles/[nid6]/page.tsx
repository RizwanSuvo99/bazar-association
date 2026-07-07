import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Phone, User, MapPin, Store, UserCheck, IdCard, Info } from "lucide-react";
import { getProfile } from "@/lib/queries";
import { getI18n } from "@/lib/i18n-server";
import { ProfileSection, FieldRow } from "@/components/profile/sections";
import { ProfileActions } from "@/components/profile/profile-actions";
import { Container } from "@/components/layout/container";
import { Card } from "@/components/ui";
import { initialsOf, phoneHref, localizeNumber } from "@/lib/format";
import type { Businessman } from "@/lib/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ nid6: string }>;
}): Promise<Metadata> {
  const { nid6 } = await params;
  try {
    const b = await getProfile(nid6);
    return { title: `${b.full_name} — ${b.unique_id}` };
  } catch {
    return { title: "প্রোফাইল" };
  }
}

export default async function ProfilePage({ params }: { params: Promise<{ nid6: string }> }) {
  const { nid6 } = await params;
  const { lang, dict } = await getI18n();

  let b: Businessman | null = null;
  try {
    b = await getProfile(nid6);
  } catch {
    b = null;
  }
  if (!b) notFound();

  const L = dict.fields;
  const dg = (v?: string | null) => (v ? localizeNumber(v, lang) : v);

  return (
    <Container className="py-8">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        {dict.common.backToList}
      </Link>

      <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
        {/* Summary */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <Card className="overflow-hidden">
            <div className="h-1.5 w-full bg-primary" />
            <div className="flex flex-col items-center p-6 text-center">
              <div className="relative h-28 w-28 overflow-hidden rounded-2xl bg-primary-soft">
                {b.profile_photo_url ? (
                  <Image src={b.profile_photo_url} alt={b.full_name} fill sizes="112px" className="object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center font-display text-4xl font-bold text-primary">
                    {initialsOf(b.full_name)}
                  </span>
                )}
              </div>
              <h1 className="mt-4 font-display text-2xl font-bold text-foreground">{b.full_name}</h1>
              <span className="mt-2 rounded-full bg-primary-soft px-3 py-1 text-sm font-semibold text-primary">
                {dg(b.unique_id)}
              </span>
              {b.business_type && (
                <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Store className="h-4 w-4" /> {b.business_type}
                </p>
              )}
              <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success" /> {dict.profile.active}
              </span>

              {b.mobile_number && (
                <a
                  href={phoneHref(b.mobile_number)}
                  className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-primary text-sm font-semibold text-primary-foreground transition hover:brightness-110"
                >
                  <Phone className="h-4 w-4" /> {dict.common.callNow}
                </a>
              )}
              <div className="mt-2 w-full">
                <ProfileActions />
              </div>
            </div>
          </Card>
        </div>

        {/* Details */}
        <div className="space-y-6">
          <ProfileSection title={dict.profile.personal} icon={<User className="h-5 w-5" />}>
            <FieldRow label={L.full_name} value={b.full_name} />
            <FieldRow label={L.father_name} value={b.father_name} />
            <FieldRow label={L.mother_name} value={b.mother_name} />
            <FieldRow label={L.blood_group} value={b.blood_group} />
            <FieldRow label={L.mobile_number} value={dg(b.mobile_number)} />
            <FieldRow label={L.voter_type} value={b.voter_type} />
          </ProfileSection>

          <ProfileSection title={dict.profile.address} icon={<MapPin className="h-5 w-5" />}>
            <FieldRow label={L.village} value={b.village} />
            <FieldRow label={L.post_office} value={b.post_office} />
            <FieldRow label={L.municipality_or_union} value={b.municipality_or_union} />
            <FieldRow label={L.upazila} value={b.upazila} />
            <FieldRow label={L.district} value={b.district} />
            <FieldRow label={L.ward_no} value={dg(b.ward_no)} />
            <FieldRow label={L.holding_no} value={dg(b.holding_no)} />
          </ProfileSection>

          <ProfileSection title={dict.profile.business} icon={<Store className="h-5 w-5" />}>
            <FieldRow label={L.current_business_name_address} value={b.current_business_name_address} />
            <FieldRow label={L.business_type} value={b.business_type} />
            <FieldRow label={L.market_name} value={b.market_name} />
            <FieldRow label={L.owner_name} value={b.owner_name} />
            <FieldRow label={L.trade_license_no} value={dg(b.trade_license_no)} />
          </ProfileSection>

          <ProfileSection title={dict.profile.nominee} icon={<UserCheck className="h-5 w-5" />}>
            <FieldRow label={L.nominee_name} value={b.nominee_name} />
            <FieldRow label={L.nominee_relation} value={b.nominee_relation} />
            <FieldRow label={L.nominee_mobile} value={dg(b.nominee_mobile)} />
          </ProfileSection>

          <ProfileSection title={dict.profile.ids} icon={<IdCard className="h-5 w-5" />}>
            <FieldRow label={dict.profile.memberId} value={dg(b.unique_id)} />
            <FieldRow label={L.nid_no} value={b.nid_no} />
            <FieldRow label={L.tin_no} value={b.tin_no} />
            <FieldRow label={L.trade_license_no} value={dg(b.trade_license_no)} />
          </ProfileSection>

          <p className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
            <Info className="h-3.5 w-3.5 shrink-0" /> {dict.profile.privacyNote}
          </p>
        </div>
      </div>
    </Container>
  );
}
