"use client";

import Link from "next/link";
import { Store, Phone, Mail, MapPin } from "lucide-react";
import { FacebookIcon } from "@/components/icons";
import { useTranslation } from "@/lib/i18n-context";
import { Container } from "./container";
import type { SiteSettings } from "@/lib/types";
import { localize } from "@/lib/i18n";

const LINKS = [
  { href: "/", key: "nav.home" },
  { href: "/about", key: "nav.about" },
  { href: "/gallery", key: "nav.gallery" },
  { href: "/rules", key: "nav.rules" },
  { href: "/notices", key: "nav.notices" },
  { href: "/contact", key: "nav.contact" },
  { href: "/register", key: "nav.register" },
];

export function Footer({ settings }: { settings: SiteSettings | null }) {
  const { t, lang } = useTranslation();
  const orgName = settings ? (lang === "en" ? settings.org_name_en : settings.org_name_bn) : "";
  const address = settings ? localize(settings as unknown as Record<string, unknown>, "contact_address", lang) : "";

  return (
    <footer className="mt-16 border-t border-border bg-card">
      <Container className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Store className="h-5 w-5" />
            </span>
            <span className="font-display text-base font-bold text-foreground">{orgName}</span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">{t("footer.tagline")}</p>
        </div>

        <div>
          <h4 className="font-display text-sm font-semibold text-foreground">{t("footer.quickLinks")}</h4>
          <ul className="mt-3 grid grid-cols-2 gap-2 text-sm">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-muted-foreground transition-colors hover:text-primary">
                  {t(l.key)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-display text-sm font-semibold text-foreground">{t("footer.contactInfo")}</h4>
          <ul className="mt-3 space-y-2.5 text-sm text-muted-foreground">
            {settings?.contact_phone && (
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                <a href={`tel:${settings.contact_phone}`}>{settings.contact_phone}</a>
              </li>
            )}
            {settings?.contact_email && (
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <a href={`mailto:${settings.contact_email}`}>{settings.contact_email}</a>
              </li>
            )}
            {address && (
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{address}</span>
              </li>
            )}
            {settings?.facebook_url && (
              <li className="flex items-center gap-2">
                <FacebookIcon className="h-4 w-4 text-primary" />
                <a href={settings.facebook_url} target="_blank" rel="noreferrer">Facebook</a>
              </li>
            )}
          </ul>
        </div>
      </Container>
      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        © {orgName} — {t("footer.rights")}
      </div>
    </footer>
  );
}
