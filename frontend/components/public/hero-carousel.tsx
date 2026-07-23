"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

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

  return (
    <section className="relative overflow-hidden">
      {/* Background */}
      {hasImages ? (
        <div className="absolute inset-0">
          {images.map((src, i) => (
            <Image
              key={`${src}-${i}`}
              src={src}
              alt=""
              fill
              priority={i === 0}
              sizes="100vw"
              className={cn(
                "object-cover transition-opacity duration-700 ease-in-out",
                i === index ? "opacity-100" : "opacity-0",
              )}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-r from-[#121214]/90 via-[#121214]/60 to-[#121214]/25" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-card">
          <div className="bazar-awning absolute inset-0" aria-hidden />
        </div>
      )}

      {/* Content */}
      <div className="relative mx-auto flex min-h-[26rem] w-full max-w-6xl flex-col justify-center px-4 py-16 sm:min-h-[32rem] sm:px-6">
        <div className="max-w-2xl">
          {memberLine && (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
                hasImages ? "bg-black/45 text-white" : "bg-primary/10 text-primary",
              )}
            >
              <Users className="h-3.5 w-3.5" />
              {memberLine}
            </span>
          )}
          <h1
            className={cn(
              "mt-4 font-display text-4xl font-bold leading-snug drop-shadow-sm sm:text-5xl",
              hasImages ? "text-white" : "text-foreground",
            )}
          >
            {title}
          </h1>
          {subtitle && (
            <p className={cn("mt-4 text-lg", hasImages ? "text-white/90" : "text-muted-foreground")}>
              {subtitle}
            </p>
          )}
          <Link
            href={ctaHref}
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
          >
            {ctaLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Carousel controls */}
      {count > 1 && (
        <>
          <button
            onClick={() => go(index - 1)}
            aria-label="previous"
            className="absolute left-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white transition hover:bg-black/65 sm:flex cursor-pointer"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => go(index + 1)}
            aria-label="next"
            className="absolute right-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white transition hover:bg-black/65 sm:flex cursor-pointer"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
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
    </section>
  );
}
