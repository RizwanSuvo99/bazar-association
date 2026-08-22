"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useTranslation } from "@/lib/i18n-context";
import { Container } from "./container";
import { LangToggle, ThemeModeToggle } from "./toggles";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", key: "nav.home" },
  // `exact` because /members/<token> is the ID-card QR form page — a different destination
  // that should not light up the directory link, which a startsWith match would do.
  { href: "/members", key: "nav.members", exact: true },
  { href: "/about", key: "nav.about" },
  { href: "/gallery", key: "nav.gallery" },
  { href: "/rules", key: "nav.rules" },
  { href: "/notices", key: "nav.notices" },
  { href: "/contact", key: "nav.contact" },
];

export function Navbar({ orgName }: { orgName: string }) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string, exact?: boolean) =>
    href === "/" || exact ? pathname === href : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur-sm">
      <Container className="flex h-16 items-center justify-between gap-3">
        <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-2.5" onClick={() => setOpen(false)}>
          <Image
            src="/bazar-logo.png"
            alt={orgName}
            width={48}
            height={44}
            priority
            className="h-9 w-auto shrink-0 object-contain sm:h-11"
          />
          {/* Wraps to two lines on phones instead of being hidden. text-balance keeps the
              two lines close in length, and min-w-0 above lets it wrap rather than overflow. */}
          <span className="max-w-[11rem] font-display text-[13px] font-bold leading-snug text-balance text-foreground sm:max-w-[15rem] sm:text-base">
            {orgName}
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
                isActive(l.href, l.exact) ? "bg-primary-soft text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t(l.key)}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden items-center gap-2 sm:flex">
            <LangToggle />
            <ThemeModeToggle />
          </div>
          <Link
            href="/register"
            className="hidden rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110 sm:inline-flex"
          >
            {t("nav.register")}
          </Link>
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-card hover:bg-surface-2 lg:hidden cursor-pointer"
            onClick={() => setOpen((v) => !v)}
            aria-label="menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </Container>

      {open && (
        <div className="border-t border-border bg-background lg:hidden">
          <Container className="flex flex-col gap-1 py-3">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-lg px-3 py-2.5 text-sm font-medium",
                  isActive(l.href, l.exact) ? "bg-primary-soft text-primary" : "text-foreground hover:bg-muted",
                )}
              >
                {t(l.key)}
              </Link>
            ))}
            <Link
              href="/register"
              onClick={() => setOpen(false)}
              className="mt-1 rounded-lg bg-primary px-3 py-2.5 text-center text-sm font-semibold text-primary-foreground"
            >
              {t("nav.register")}
            </Link>
            <div className="mt-2 flex items-center gap-2">
              <LangToggle />
              <ThemeModeToggle />
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}
