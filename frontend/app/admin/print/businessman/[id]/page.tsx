import { notFound } from "next/navigation";
import { getAdminBusinessman } from "@/lib/admin-queries";
import { getSettings } from "@/lib/queries";
import { RegistrationFormDownload } from "@/components/admin/registration-form-download";
import type { Businessman, SiteSettings } from "@/lib/types";

export const metadata = { title: "রেজিস্ট্রেশন ফরম" };

// Fetch the photo server-side and inline it as a data URI so the client-side html2canvas
// export has no cross-origin taint.
async function toDataUri(url?: string | null): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const type = res.headers.get("content-type") || "image/jpeg";
    const buf = Buffer.from(await res.arrayBuffer());
    return `data:${type};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

export default async function BusinessmanFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let b: Businessman | null = null;
  try {
    b = await getAdminBusinessman(id);
  } catch {
    b = null;
  }
  if (!b) notFound();

  const settings = await getSettings().catch(() => null as SiteSettings | null);
  const photo = await toDataUri(b.profile_photo_url);

  return <RegistrationFormDownload b={b} settings={settings} photo={photo} />;
}
