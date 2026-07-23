"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { Container } from "@/components/layout/container";
import { cn } from "@/lib/utils";

/** Modern contained "bento" hero: an editorial text tile beside a rounded
 *  photo-carousel tile. No text-over-photo overlays, so it reads cleanly in
 *  both light and dark mode. */
export function HeroCarousel({
  images,
  title,
  subtitle,
  ctaLabel,
  ctaHref = "/register",
  memberLine,
}: {
  images: string[];
  title: string;
  subtitle?: string;
  ctaLabel: string;
  ctaHref?: string;
  memberLine?: string;
}) {
  const count = images.length;
  const hasImages = count > 0;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (count <= 1) return;
    const id = setInterval(() => setIndex((v) => (v + 1) % count), 5000);
    return () => clearInterval(id);
  }, [count]);

  const go = (i: number) => setIndex(((i % count) + count) % count);

  const textTile = (
    <div
      className={cn(
        "relative flex flex-col justify-center overflow-hidden rounded-2xl bg-card p-8 sm:p-10",
        !hasImages && "items-center py-16 text-center",
      )}
    >
      {!hasImages && <div className="bazar-awning absolute inset-0" aria-hidden />}
      <div className="relative">
        {memberLine && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Users className="h-3.5 w-3.5" />
            {memberLine}
          </span>
        )}
        <h1 className="mt-4 font-display text-4xl font-bold leading-snug text-foreground sm:text-5xl">
          {title}
        </h1>
        <div className="mt-4 h-0.5 w-16 bg-primary" aria-hidden />
        {subtitle && <p className="mt-4 max-w-xl text-lg text-muted-foreground">{subtitle}</p>}
        <Link
          href={ctaHref}
          className="mt-7 inline-flex items-center gap-2 self-start rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
        >
          {ctaLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );

  return (
    <section className="py-6 sm:py-8">
      <Container>
        {hasImages ? (
          <div className="grid items-stretch gap-4 lg:grid-cols-[1fr_1.15fr]">
            {textTile}

            {/* Photo tile */}
            <div className="group relative min-h-[16rem] overflow-hidden rounded-2xl bg-surface-2 sm:min-h-[22rem] lg:min-h-[26rem]">
              {images.map((src, i) => (
                <Image
                  key={`${src}-${i}`}
                  src={src}
                  alt=""
                  fill
                  priority={i === 0}
                  sizes="(min-width: 1024px) 60vw, 100vw"
                  className={cn(
                    "object-cover transition-opacity duration-700 ease-in-out",
                    i === index ? "opacity-100" : "opacity-0",
                  )}
                />
              ))}

              {count > 1 && (
                <>
                  {/* soft strip only behind the dots, not across the photo */}
                  <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/35 to-transparent" />
                  <button
                    onClick={() => go(index - 1)}
                    aria-label="previous"
                    className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white opacity-0 transition-opacity hover:bg-black/65 group-hover:opacity-100 sm:flex cursor-pointer"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => go(index + 1)}
                    aria-label="next"
                    className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white opacity-0 transition-opacity hover:bg-black/65 group-hover:opacity-100 sm:flex cursor-pointer"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
                    {images.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => go(i)}
                        aria-label={`slide ${i + 1}`}
                        className={cn(
                          "h-2 rounded-full transition-all cursor-pointer",
                          i === index ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/80",
                        )}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          textTile
        )}
      </Container>
    </section>
  );
}
