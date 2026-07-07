import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";

export function Hero({
  title,
  subtitle,
  ctaLabel,
  ctaHref = "/register",
  memberLine,
}: {
  title: string;
  subtitle?: string;
  ctaLabel: string;
  ctaHref?: string;
  memberLine?: string;
}) {
  return (
    <section className="relative overflow-hidden border-b border-border bg-card">
      <div className="bazar-awning absolute inset-0 opacity-70" aria-hidden />
      <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary-soft blur-3xl" aria-hidden />
      <div className="relative mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="max-w-2xl">
          {memberLine && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-primary">
              <Users className="h-3.5 w-3.5" />
              {memberLine}
            </span>
          )}
          <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-foreground sm:text-5xl">
            {title}
          </h1>
          {subtitle && <p className="mt-4 text-lg text-muted-foreground">{subtitle}</p>}
          <Link
            href={ctaHref}
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
          >
            {ctaLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
