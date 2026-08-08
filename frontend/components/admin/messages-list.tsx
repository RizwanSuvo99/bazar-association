"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Phone, Check, Circle, Trash2, Loader2, AlertCircle } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";
import { Card, Button } from "@/components/ui";
import type { ContactMessage } from "@/lib/types";

export function MessagesList({ messages }: { messages: ContactMessage[] }) {
  const router = useRouter();
  const [read, setRead] = useState<Record<number, boolean>>(
    Object.fromEntries(messages.map((m) => [m.id, m.is_read])),
  );
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");

  function fail(e: unknown, fallback: string) {
    setError(e instanceof ApiError ? e.message : fallback);
  }

  async function markRead(id: number) {
    setError("");
    setRead((r) => ({ ...r, [id]: true }));
    try {
      await apiFetch(`/admin/contact-messages/${id}`, { method: "PATCH", json: { is_read: true } });
      router.refresh(); // keeps the sidebar unread badge in step
    } catch (e) {
      setRead((r) => ({ ...r, [id]: false })); // put the dot back if it did not stick
      fail(e, "পঠিত হিসেবে চিহ্নিত করা যায়নি।");
    }
  }

  async function remove(m: ContactMessage) {
    if (!confirm(`${m.name}-এর বার্তাটি মুছে ফেলতে চান? এটি ফেরানো যাবে না।`)) return;
    setError("");
    setBusyId(m.id);
    try {
      await apiFetch(`/admin/contact-messages/${m.id}`, { method: "DELETE" });
      router.refresh();
    } catch (e) {
      fail(e, "বার্তা মুছে ফেলা যায়নি।");
    } finally {
      setBusyId(null);
    }
  }

  if (messages.length === 0) {
    return <p className="py-16 text-center text-muted-foreground">—</p>;
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </p>
      )}

      {messages.map((m) => {
        const isRead = read[m.id];
        const busy = busyId === m.id;
        return (
          <Card key={m.id} className={"p-4 " + (isRead ? "" : "bg-primary/8 ring-1 ring-primary/30")}>
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
                  {m.email && (
                    <a href={`mailto:${m.email}`} className="flex items-center gap-1 hover:text-primary">
                      <Mail className="h-3.5 w-3.5" /> {m.email}
                    </a>
                  )}
                  {m.phone && (
                    <a href={`tel:${m.phone}`} className="flex items-center gap-1 hover:text-primary">
                      <Phone className="h-3.5 w-3.5" /> {m.phone}
                    </a>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {!isRead && (
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => markRead(m.id)}>
                    <Check className="h-4 w-4" /> পঠিত
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="danger"
                  disabled={busy}
                  onClick={() => remove(m)}
                  aria-label="বার্তা মুছুন"
                  title="মুছে ফেলুন"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
