import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";

/** Bento stat tile: eyebrow label + big numeral, icon tucked top-right.
 *  `className` sizes/spans the tile in the grid; `children` adds extra rows
 *  (breakdown chips, footer links) for feature tiles. */
export function StatCard({
  label,
  value,
  icon: Icon,
  href,
  className,
  valueClassName,
  children,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  href?: string;
  className?: string;
  valueClassName?: string;
  children?: React.ReactNode;
}) {
  const card = (
    <Card
      className={cn(
        "flex h-full flex-col p-6 transition-colors",
        href && "hover:bg-surface-2",
        !href && className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
        <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
      </div>
      <p className={cn("mt-3 font-display text-3xl font-bold tabular-nums text-foreground", valueClassName)}>
        {value}
      </p>
      {children}
    </Card>
  );
  return href ? (
    <Link href={href} className={cn("block", className)}>
      {card}
    </Link>
  ) : (
    card
  );
}
