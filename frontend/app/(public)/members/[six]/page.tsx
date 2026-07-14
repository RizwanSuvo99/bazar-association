import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FileDown } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui";
import { getProfile } from "@/lib/queries";
import type { Businessman } from "@/lib/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ six: string }>;
}): Promise<Metadata> {
  const { six } = await params;
  try {
    const b = await getProfile(six);
    return { title: `${b.full_name} — ${b.unique_id}` };
  } catch {
    return { title: "সদস্য ফরম" };
  }
}

// Public page an ID-card QR points to: shows the member's registration form.
export default async function MemberFormPage({ params }: { params: Promise<{ six: string }> }) {
  const { six } = await params;
  const api = process.env.NEXT_PUBLIC_API_BASE_URL;

  let b: Businessman | null = null;
  try {
    b = await getProfile(six);
  } catch {
    b = null;
  }
  if (!b) notFound();

  return (
    <Container className="py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">{b.full_name}</h1>
            <p className="text-sm text-muted-foreground">{b.unique_id}</p>
          </div>
          <a href={`${api}/api/members/${six}/form.pdf`} download>
            <Button size="sm">
              <FileDown className="h-4 w-4" /> ফরম ডাউনলোড (PDF)
            </Button>
          </a>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${api}/api/members/${six}/form.png`}
          alt={`${b.full_name} — registration form`}
          className="w-full rounded-lg border border-border shadow-sm"
        />
      </div>
    </Container>
  );
}
