import { getAdminMessages } from "@/lib/admin-queries";
import { getI18n } from "@/lib/i18n-server";
import { MessagesList } from "@/components/admin/messages-list";
import { Pagination } from "@/components/pagination";
import type { ContactMessage } from "@/lib/types";

type SP = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function AdminMessagesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const page = first(sp.page) || "1";
  const { lang, dict } = await getI18n();
  const { items: messages, meta } = await getAdminMessages(page).catch(
    () => ({ items: [] as ContactMessage[], meta: { page: 1, limit: 15, total: 0, totalPages: 1 } }),
  );

  return (
    <div className="space-y-5">
      <h1 className="font-display text-3xl font-bold text-foreground">{dict.admin.messages}</h1>
      <MessagesList messages={messages} />
      <Pagination
        page={meta.page}
        totalPages={meta.totalPages}
        basePath="/admin/messages"
        lang={lang}
        prevLabel={dict.common.previous}
        nextLabel={dict.common.next}
      />
    </div>
  );
}
