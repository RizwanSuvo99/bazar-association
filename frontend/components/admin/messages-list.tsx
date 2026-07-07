"use client";

import { useState } from "react";
import { Mail, Phone, Check, Circle } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useTranslation } from "@/lib/i18n-context";
import { Card, Button } from "@/components/ui";
import type { ContactMessage } from "@/lib/types";

export function MessagesList({ messages }: { messages: ContactMessage[] }) {
  const { t } = useTranslation();
  const [read, setRead] = useState<Record<number, boolean>>(
    Object.fromEntries(messages.map((m) => [m.id, m.is_read])),
  );

  async function markRead(id: number) {
    setRead((r) => ({ ...r, [id]: true }));
    await apiFetch(`/admin/contact-messages/${id}`, { method: "PATCH", json: { is_read: true } }).catch(() => {});
  }

  if (messages.length === 0) {
    return <p className="py-16 text-center text-muted-foreground">—</p>;
  }

  return (
    <div className="space-y-3">
      {messages.map((m) => {
        const isRead = read[m.id];
        return (
          <Card key={m.id} className={"p-4 " + (isRead ? "" : "border-primary/40 bg-primary-soft/30")}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {!isRead && <Circle className="h-2 w-2 fill-primary text-primary" />}
                  <span className="font-medium text-foreground">{m.name}</span>
                  <span className="text-xs text-muted-foreground">{m.created_at?.slice(0, 10)}</span>
                </div>
                {m.subject && <p className="mt-1 text-sm font-medium text-foreground">{m.subject}</p>}
                <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{m.message}</p>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {m.email && <a href={`mailto:${m.email}`} className="flex items-center gap-1 hover:text-primary"><Mail className="h-3.5 w-3.5" /> {m.email}</a>}
                  {m.phone && <a href={`tel:${m.phone}`} className="flex items-center gap-1 hover:text-primary"><Phone className="h-3.5 w-3.5" /> {m.phone}</a>}
                </div>
              </div>
              {!isRead && (
                <Button size="sm" variant="outline" onClick={() => markRead(m.id)}>
                  <Check className="h-4 w-4" /> পঠিত
                </Button>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
