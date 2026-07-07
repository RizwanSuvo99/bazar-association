import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui";

export function StatCard({
  label,
  value,
  icon: Icon,
  href,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  href?: string;
}) {
  const inner = (
    <Card className="flex items-center gap-4 p-5 transition-colors hover:border-primary/50">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary">
        <Icon className="h-6 w-6" />
      </span>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-display text-2xl font-bold text-foreground">{value}</p>
      </div>
    </Card>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}
