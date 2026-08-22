"use client";

import Link from "next/link";
import Image from "next/image";
import { Phone, Mail, MapPin } from "lucide-react";
import { FacebookIcon, WhatsAppIcon } from "@/components/icons";
import { useTranslation } from "@/lib/i18n-context";
import { Container } from "./container";
import type { SiteSettings } from "@/lib/types";
import { localize } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", key: "nav.home" },
  { href: "/members", key: "nav.members" },
  { href: "/about", key: "nav.about" },
  { href: "/gallery", key: "nav.gallery" },
  { href: "/rules", key: "nav.rules" },
  { href: "/notices", key: "nav.notices" },
  { href: "/contact", key: "nav.contact" },
  { href: "/register", key: "nav.register" },
];

const DEVELOPER = {
  name: "Md Rizwan Uddin",
  facebook: "https://www.facebook.com/rizwansuvo1/",
  whatsapp: "https://wa.me/qr/XNQEZJI3RSS7J1",
  email: "rizwanshuvo@gmail.com",
  phone: "01521408552",
};

/** Small square icon button used for the social rows. */
function IconLink({
  href,
  label,
  external,
  className,
  children,
}: {
  href: string;
  label: string;
  external?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      title={label}
      {...(external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 text-muted-foreground",
        "transition-colors hover:bg-primary hover:text-primary-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
    >
      {children}
    </a>
  );
}

export function Footer({ settings }: { settings: SiteSettings | null }) {
  const { t, lang } = useTranslation();
  const orgName = settings ? (lang === "en" ? settings.org_name_en : settings.org_name_bn) : "";
  const address = settings ? localize(settings as unknown as Record<string, unknown>, "contact_address", lang) : "";
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 bg-card">
      {/* Accent that fades out at both ends rather than a flat rule */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary to-transparent" aria-hidden />

      <Container className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-3">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-3">
            <Image
              src="/bazar-logo.png"
              alt={orgName}
              width={56}
              height={51}
              className="h-14 w-auto object-contain"
            />
            <span className="font-display text-base font-bold leading-snug text-foreground">{orgName}</span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">{t("footer.tagline")}</p>
          {/* Just the association's own social presence — phone and email live in the
              contact column, so repeating them here would only duplicate. */}
          {settings?.facebook_url && (
            <div className="mt-5 flex gap-2">
              <IconLink href={settings.facebook_url} label="Facebook" external>
                <FacebookIcon className="h-4 w-4" />
              </IconLink>
            </div>
          )}
        </div>

        {/* Quick links */}
        <div>
          <h4 className="font-display text-sm font-semibold tracking-wide text-foreground">
            {t("footer.quickLinks")}
          </h4>
          <span className="mt-2 block h-0.5 w-8 rounded-full bg-primary" aria-hidden />
          <ul className="mt-4 grid grid-cols-2 gap-2.5 text-sm">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  {t(l.key)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="font-display text-sm font-semibold tracking-wide text-foreground">
            {t("footer.contactInfo")}
          </h4>
          <span className="mt-2 block h-0.5 w-8 rounded-full bg-primary" aria-hidden />
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            {settings?.contact_phone && (
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-primary" />
                <a href={`tel:${settings.contact_phone}`} className="transition-colors hover:text-primary">
                  {settings.contact_phone}
                </a>
              </li>
            )}
            {settings?.contact_email && (
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-primary" />
                <a
                  href={`mailto:${settings.contact_email}`}
                  className="break-all transition-colors hover:text-primary"
                >
                  {settings.contact_email}
                </a>
              </li>
            )}
            {address && (
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="leading-relaxed">{address}</span>
              </li>
            )}
          </ul>
        </div>
      </Container>

      {/* Bottom bar: copyright on the left, developer credit on the right */}
      <div className="border-t border-border/60">
        <Container className="flex flex-col items-center justify-between gap-4 py-5 text-xs text-muted-foreground sm:flex-row">
          <p className="text-center sm:text-left">
            © {year} {orgName} — {t("footer.rights")}
          </p>

          <div className="flex flex-col items-center gap-2.5 sm:flex-row">
            <span>
              {t("footer.developedBy")}{" "}
              <a
                href={DEVELOPER.facebook}
                target="_blank"
                rel="noreferrer noopener"
                className="font-semibold text-foreground transition-colors hover:text-primary"
              >
                {DEVELOPER.name}
              </a>
            </span>
            <div className="flex gap-1.5">
              <IconLink
                href={DEVELOPER.facebook}
                label={`${DEVELOPER.name} — Facebook`}
                external
                className="h-8 w-8"
              >
                <FacebookIcon className="h-3.5 w-3.5" />
              </IconLink>
              <IconLink
                href={DEVELOPER.whatsapp}
                label={`${DEVELOPER.name} — WhatsApp`}
                external
                className="h-8 w-8"
              >
                <WhatsAppIcon className="h-3.5 w-3.5" />
              </IconLink>
              <IconLink
                href={`mailto:${DEVELOPER.email}`}
                label={`${DEVELOPER.name} — ${DEVELOPER.email}`}
                className="h-8 w-8"
              >
                <Mail className="h-3.5 w-3.5" />
              </IconLink>
              <IconLink
                href={`tel:${DEVELOPER.phone}`}
                label={`${DEVELOPER.name} — ${DEVELOPER.phone}`}
                className="h-8 w-8"
              >
                <Phone className="h-3.5 w-3.5" />
              </IconLink>
            </div>
          </div>
        </Container>
      </div>
    </footer>
  );
}
