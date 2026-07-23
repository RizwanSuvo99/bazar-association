import type { ReactNode } from "react";
import { Card } from "@/components/ui";

export function ProfileSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card className="p-6">
      <h2 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {icon && <span className="text-primary [&>svg]:h-4 [&>svg]:w-4">{icon}</span>}
        {title}
      </h2>
      <dl className="divide-y divide-border/60">{children}</dl>
    </Card>
  );
}

export function FieldRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
      <dt className="shrink-0 text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-foreground sm:text-right">
        {value && String(value).trim() ? value : "—"}
      </dd>
    </div>
  );
}
