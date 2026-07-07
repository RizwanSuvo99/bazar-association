import { Phone, Mail, MapPin } from "lucide-react";
import { FacebookIcon } from "@/components/icons";
import { PageHeader } from "@/components/public/page-header";
import { Container } from "@/components/layout/container";
import { ContactForm } from "@/components/public/contact-form";
import { Card } from "@/components/ui";
import { getPage, getSettings } from "@/lib/queries";
import { getI18n } from "@/lib/i18n-server";
import { localize } from "@/lib/i18n";
import type { PageContent, SiteSettings } from "@/lib/types";

export const metadata = { title: "যোগাযোগ" };

export default async function ContactPage() {
  const { lang, dict } = await getI18n();
  const [page, settings] = await Promise.all([
    getPage("contact").catch(() => null as PageContent | null),
    getSettings().catch(() => null as SiteSettings | null),
  ]);

  const title = (page && localize(page, "title", lang)) || dict.nav.contact;
  const subtitle = page ? localize(page, "subtitle", lang) : "";
  const body = page ? localize(page, "body", lang) : "";
  const address = settings ? localize(settings as unknown as Record<string, unknown>, "contact_address", lang) : "";

  const items = [
    settings?.contact_phone && { icon: Phone, label: dict.contact.phone, value: settings.contact_phone, href: `tel:${settings.contact_phone}` },
    settings?.contact_email && { icon: Mail, label: dict.contact.email, value: settings.contact_email, href: `mailto:${settings.contact_email}` },
    address && { icon: MapPin, label: dict.contact.address, value: address, href: null },
    settings?.facebook_url && { icon: FacebookIcon, label: "Facebook", value: "facebook.com", href: settings.facebook_url },
  ].filter(Boolean) as { icon: typeof Phone; label: string; value: string; href: string | null }[];

  return (
    <>
      <PageHeader title={title} subtitle={subtitle} />
      <Container className="py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.3fr]">
          <div>
            {body && <p className="mb-6 text-muted-foreground">{body}</p>}
            <div className="space-y-3">
              {items.map((it, i) => (
                <Card key={i} className="flex items-start gap-3 p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                    <it.icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{it.label}</p>
                    {it.href ? (
                      <a href={it.href} target={it.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="break-words font-medium text-foreground hover:text-primary">
                        {it.value}
                      </a>
                    ) : (
                      <p className="break-words font-medium text-foreground">{it.value}</p>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
          <ContactForm />
        </div>
      </Container>
    </>
  );
}
