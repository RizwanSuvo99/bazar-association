import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FileDown, FileSignature, ExternalLink } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Button, Badge } from "@/components/ui";
import { getMemberByToken } from "@/lib/queries";
import type { MemberMeta } from "@/lib/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  try {
    const m = await getMemberByToken(token);
    return { title: `${m.full_name} — ${m.unique_id}` };
  } catch {
    return { title: "সদস্য ফরম" };
  }
}

// Public page an ID-card QR points to: shows the member's registration form.
// When the office has attached the hand-signed copy AND left it switched on, that copy is
// shown instead of the generated one. The API only sends signed_form when both hold, so
// a hidden upload's URL never reaches the browser.
export default async function MemberFormPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const api = process.env.NEXT_PUBLIC_API_BASE_URL;

  let member: MemberMeta | null = null;
  try {
    member = await getMemberByToken(token);
  } catch {
    member = null;
  }
  if (!member) notFound();

  const signed = member.signed_form;
  const downloadUrl = signed ? signed.url : `${api}/api/members/${token}/form.pdf`;

  return (
    <Container className="py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">{member.full_name}</h1>
            <div className="mt-0.5 flex flex-wrap items-center gap-2">
              <p className="text-sm text-muted-foreground">{member.unique_id}</p>
              {signed && (
                <Badge className="bg-primary-soft text-primary">
                  <FileSignature className="mr-1 inline h-3 w-3" /> স্বাক্ষরিত কপি
                </Badge>
              )}
            </div>
          </div>
          <a href={downloadUrl} target={signed ? "_blank" : undefined} rel="noreferrer" download={!signed}>
            <Button size="sm">
              <FileDown className="h-4 w-4" /> ফরম ডাউনলোড
            </Button>
          </a>
        </div>

        {signed ? (
          signed.is_pdf ? (
            // Browsers that refuse to embed a PDF (most mobiles) fall through to the link.
            <object data={signed.url} type="application/pdf" className="h-[80vh] w-full rounded-xl bg-white">
              <div className="rounded-xl bg-card p-8 text-center">
                <p className="mb-3 text-sm text-muted-foreground">
                  এই ব্রাউজারে PDF সরাসরি দেখানো যাচ্ছে না।
                </p>
                <a href={signed.url} target="_blank" rel="noreferrer">
                  <Button size="sm">
                    <ExternalLink className="h-4 w-4" /> স্বাক্ষরিত ফরম দেখুন
                  </Button>
                </a>
              </div>
            </object>
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={signed.url}
              alt={`${member.full_name} — signed registration form`}
              className="w-full rounded-xl bg-white p-2"
            />
          )
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={`${api}/api/members/${token}/form.png`}
            alt={`${member.full_name} — registration form`}
            className="w-full rounded-xl bg-white p-2"
          />
        )}
      </div>
    </Container>
  );
}
