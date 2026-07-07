import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone, Store } from "lucide-react";
import type { Businessman, Lang } from "@/lib/types";
import { initialsOf } from "@/lib/format";

export function ProfileCard({ b, lang }: { b: Businessman; lang: Lang }) {
  return (
    <Link
      href={`/profiles/${b.six_digit_id}`}
      className="group relative flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border bg-card transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5"
    >
      {/* Awning accent bar */}
      <div className="h-1.5 w-full bg-primary" />
      <div className="flex gap-4 p-5">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-primary-soft">
          {b.profile_photo_url ? (
            <Image
              src={b.profile_photo_url}
              alt={b.full_name}
              fill
              sizes="80px"
              className="object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center font-display text-2xl font-bold text-primary">
              {initialsOf(b.full_name)}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-lg font-semibold text-foreground group-hover:text-primary">
            {b.full_name}
          </h3>
          <span className="mt-1 inline-block rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">
            {b.unique_id}
          </span>
          {b.business_type && (
            <p className="mt-2 flex items-center gap-1.5 truncate text-sm text-muted-foreground">
              <Store className="h-3.5 w-3.5 shrink-0" />
              {b.business_type}
            </p>
          )}
        </div>
      </div>
      <div className="mt-auto space-y-1.5 border-t border-border px-5 py-3 text-sm text-muted-foreground">
        {b.market_name && (
          <p className="flex items-center gap-1.5 truncate">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
            {b.market_name}
          </p>
        )}
        {b.mobile_number && (
          <p className="flex items-center gap-1.5 truncate">
            <Phone className="h-3.5 w-3.5 shrink-0 text-primary" />
            {lang === "bn" ? b.mobile_number.replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[Number(d)]) : b.mobile_number}
          </p>
        )}
      </div>
    </Link>
  );
}
