import { PageHeader } from "@/components/public/page-header";
import { Container } from "@/components/layout/container";
import { Markdown } from "@/components/markdown";
import { getPage } from "@/lib/queries";
import { getI18n } from "@/lib/i18n-server";
import { localize } from "@/lib/i18n";
import type { PageContent } from "@/lib/types";

export const metadata = { title: "পরিচিতি" };

export default async function AboutPage() {
  const { lang, dict } = await getI18n();
  const page = await getPage("about").catch(() => null as PageContent | null);
  const title = (page && localize(page, "title", lang)) || dict.nav.about;
  const subtitle = page ? localize(page, "subtitle", lang) : "";
  const body = page ? localize(page, "body", lang) : "";

  return (
    <>
      <PageHeader title={title} subtitle={subtitle} />
      <Container className="py-10">
        <article className="mx-auto max-w-3xl">
          <Markdown content={body} />
        </article>
      </Container>
    </>
  );
}
