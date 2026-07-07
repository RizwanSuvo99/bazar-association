"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Inbox,
  FileText,
  Image as ImageIcon,
  Megaphone,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
  ExternalLink,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n-context";
import { apiFetch } from "@/lib/api";
import { ThemeModeToggle, LangToggle } from "@/components/layout/toggles";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", key: "admin.dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/businessmen", key: "admin.members", icon: Users },
  { href: "/admin/requests", key: "admin.requests", icon: Inbox, badge: true },
  { href: "/admin/content", key: "admin.content", icon: FileText },
  { href: "/admin/gallery", key: "admin.gallery", icon: ImageIcon },
  { href: "/admin/notices", key: "admin.notices", icon: Megaphone },
  { href: "/admin/messages", key: "admin.messages", icon: MessageSquare },
  { href: "/admin/settings", key: "admin.settings", icon: Settings },
];

export function AdminShell({
  adminName,
  pendingCount,
  children,
}: {
  adminName: string;
  pendingCount: number;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  async function logout() {
    await apiFetch("/auth/logout", { method: "POST" }).catch(() => {});
    router.push("/admin/login");
    router.refresh();
  }

  const navList = (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setOpen(false)}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            isActive(item.href, item.exact)
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          <item.icon className="h-4.5 w-4.5" />
          <span className="flex-1">{t(item.key)}</span>
          {item.badge && pendingCount > 0 && (
            <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground">
              {pendingCount}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[16rem_1fr]">
      {/* Desktop sidebar */}
      <aside className="hidden border-r border-border bg-card lg:flex lg:flex-col">
        <div className="flex h-16 items-center gap-2.5 border-b border-border px-5">
          <Image src="/bazar-logo.png" alt="Logo" width={40} height={36} className="h-9 w-auto object-contain" />
          <span className="font-display text-sm font-bold text-foreground">অ্যাডমিন প্যানেল</span>
        </div>
        <div className="flex-1 overflow-y-auto p-3">{navList}</div>
        <div className="border-t border-border p-3">
          <Link href="/" target="_blank" className="mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted">
            <ExternalLink className="h-4 w-4" /> সাইট দেখুন
          </Link>
          <button onClick={logout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10 cursor-pointer">
            <LogOut className="h-4 w-4" /> {t("admin.logout")}
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col bg-card p-3 shadow-xl">
            <div className="mb-2 flex items-center justify-between px-2 py-2">
              <span className="font-display text-sm font-bold">অ্যাডমিন প্যানেল</span>
              <button onClick={() => setOpen(false)} className="cursor-pointer"><X className="h-5 w-5" /></button>
            </div>
            {navList}
            <button onClick={logout} className="mt-2 flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10 cursor-pointer">
              <LogOut className="h-4 w-4" /> {t("admin.logout")}
            </button>
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/85 px-4 backdrop-blur sm:px-6">
          <button className="lg:hidden cursor-pointer" onClick={() => setOpen(true)} aria-label="menu">
            <Menu className="h-6 w-6" />
          </button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">{adminName}</span>
            <LangToggle />
            <ThemeModeToggle />
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
