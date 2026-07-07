import { PageHeader } from "@/components/public/page-header";
import { Container } from "@/components/layout/container";
import { Markdown } from "@/components/markdown";
import { Card } from "@/components/ui";
import { getPage } from "@/lib/queries";
import { getI18n } from "@/lib/i18n-server";
import { localize } from "@/lib/i18n";
import type { PageContent } from "@/lib/types";

export const metadata = { title: "নিয়মকানুন" };

export default async function RulesPage() {
  const { lang, dict } = await getI18n();
  const page = await getPage("rules").catch(() => null as PageContent | null);
  const title = (page && localize(page, "title", lang)) || dict.nav.rules;
  const subtitle = page ? localize(page, "subtitle", lang) : "";
  const body = page ? localize(page, "body", lang) : "";

  return (
    <>
      <PageHeader title={title} subtitle={subtitle} />
      <Container className="py-10">
        <Card className="mx-auto max-w-3xl p-6 sm:p-8">
          <Markdown content={body} />
        </Card>
      </Container>
    </>
  );
}
