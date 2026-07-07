import { FileText, Eye, Download, CalendarDays } from "lucide-react";
import { PageHeader } from "@/components/public/page-header";
import { Container } from "@/components/layout/container";
import { EmptyState } from "@/components/public/empty-state";
import { Card } from "@/components/ui";
import { getNotices } from "@/lib/queries";
import { getI18n } from "@/lib/i18n-server";
import { localize } from "@/lib/i18n";
import { localizeNumber } from "@/lib/format";
import type { Notice } from "@/lib/types";

export const metadata = { title: "নোটিশ" };

export default async function NoticesPage() {
  const { lang, dict } = await getI18n();
  const notices = await getNotices().catch(() => [] as Notice[]);

  return (
    <>
      <PageHeader title={dict.notices.title} subtitle={dict.notices.subtitle} />
      <Container className="py-10">
        {notices.length === 0 ? (
          <EmptyState title={dict.notices.empty} hint="" />
        ) : (
          <div className="space-y-3">
            {notices.map((n) => {
              const title = localize(n as unknown as Record<string, unknown>, "title", lang);
              const date = localizeNumber(n.created_at?.slice(0, 10) ?? "", lang);
              return (
                <Card key={n.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                      <FileText className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="font-display font-semibold text-foreground">{title}</h3>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CalendarDays className="h-3.5 w-3.5" /> {dict.notices.publishedOn}: {date}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <a
                      href={n.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-10 items-center gap-1.5 rounded-[var(--radius-md)] bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:brightness-110"
                    >
                      <Eye className="h-4 w-4" /> {dict.notices.view}
                    </a>
                    <a
                      href={n.file_url}
                      download={n.file_name || true}
                      className="inline-flex h-10 items-center gap-1.5 rounded-[var(--radius-md)] border border-border bg-card px-4 text-sm font-medium hover:bg-muted"
                    >
                      <Download className="h-4 w-4" /> {dict.notices.download}
                    </a>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </Container>
    </>
  );
}
