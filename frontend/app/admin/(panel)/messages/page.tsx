import { getAdminMessages } from "@/lib/admin-queries";
import { getI18n } from "@/lib/i18n-server";
import { MessagesList } from "@/components/admin/messages-list";
import type { ContactMessage } from "@/lib/types";

export default async function AdminMessagesPage() {
  const { dict } = await getI18n();
  const messages = await getAdminMessages().catch(() => [] as ContactMessage[]);

  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-bold text-foreground">{dict.admin.messages}</h1>
      <MessagesList messages={messages} />
    </div>
  );
}
