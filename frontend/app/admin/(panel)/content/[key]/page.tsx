import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getI18n } from "@/lib/i18n-server";
import { getPage } from "@/lib/queries";
import { ContentEditor } from "@/components/admin/content-editor";
import type { PageContent } from "@/lib/types";

const VALID = ["home", "about", "contact", "rules"];

export default async function ContentEditPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  if (!VALID.includes(key)) notFound();
  const { dict } = await getI18n();

  let page: PageContent | null = null;
  try {
    page = await getPage(key);
  } catch {
    page = null;
  }
  // Fall back to an empty shell so a not-yet-created page can still be edited.
  const content: PageContent =
    page ?? ({ id: 0, page_key: key as PageContent["page_key"], extra: {} } as PageContent);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Link href="/admin/content" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> {dict.admin.content}
      </Link>
      <h1 className="font-display text-2xl font-bold capitalize text-foreground">{key}</h1>
      <ContentEditor page={content} />
    </div>
  );
}
