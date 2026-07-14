import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FileDown } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui";
import { getMemberByToken } from "@/lib/queries";

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
export default async function MemberFormPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const api = process.env.NEXT_PUBLIC_API_BASE_URL;

  let member: { full_name: string; unique_id: string } | null = null;
  try {
    member = await getMemberByToken(token);
  } catch {
    member = null;
  }
  if (!member) notFound();

  return (
    <Container className="py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">{member.full_name}</h1>
            <p className="text-sm text-muted-foreground">{member.unique_id}</p>
          </div>
          <a href={`${api}/api/members/${token}/form.pdf`} download>
            <Button size="sm">
              <FileDown className="h-4 w-4" /> ফরম ডাউনলোড (PDF)
            </Button>
          </a>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${api}/api/members/${token}/form.png`}
          alt={`${member.full_name} — registration form`}
          className="w-full rounded-lg border border-border shadow-sm"
        />
      </div>
    </Container>
  );
}
