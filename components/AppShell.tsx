"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, ClipboardList, ClipboardPlus, FileText, History, LayoutDashboard, LogOut, ScanLine, UserRound, UsersRound } from "lucide-react";
import type { Role } from "@/lib/db";
import { logoutAction } from "@/app/actions";
import { Brand } from "@/components/Brand";
import { initials } from "@/lib/ui";
import { NotificationCenter } from "@/components/NotificationCenter";
import { ThemeToggle } from "@/components/ThemeToggle";

type Item = { href: string; label: string; icon: typeof LayoutDashboard };

const nav: Record<Role, Item[]> = {
  STUDENT: [
    { href: "/student", label: "Beranda", icon: LayoutDashboard },
    { href: "/student/apply", label: "Ajukan izin", icon: ClipboardPlus },
    { href: "/student/history", label: "Riwayat", icon: FileText },
    { href: "/student/profile", label: "Profil", icon: UserRound },
  ],
  SECURITY: [
    { href: "/security", label: "Validasi", icon: ScanLine },
    { href: "/security/outside", label: "Riwayat", icon: History },
    { href: "/security/profile", label: "Profil Satpam", icon: UserRound },
  ],
  MANAGER: [
    { href: "/manager", label: "Dashboard", icon: LayoutDashboard },
    { href: "/manager/history", label: "Riwayat", icon: History },
    { href: "/manager/users", label: "Pengaturan", icon: UsersRound },
    { href: "/manager/stats", label: "Laporan", icon: BarChart3 },
    { href: "/manager/audit", label: "Log Aktivitas", icon: ClipboardList },
    { href: "/manager/profile", label: "Profil", icon: UserRound },
  ],
};

const roleTitle: Record<Role, string> = { STUDENT: "Mahasiswa", SECURITY: "Satpam", MANAGER: "Pengelola RTB" };

export function AppShell({ role, name, children }: { role: Role; name: string; children: React.ReactNode }) {
  const items = nav[role];
  const pathname = usePathname();
  const isActive = (href: string) => href.split("#")[0] === pathname;
  const activeLabel = items.find((item) => isActive(item.href))?.label ?? items[0].label;
  const operationsMode = role === "SECURITY" || role === "MANAGER";
  return (
    <div className={`min-h-screen ${operationsMode ? "security-shell" : "bg-paper"}`}>
      <aside className={`fixed inset-y-0 left-0 z-20 hidden w-64 flex-col p-5 md:flex ${operationsMode ? "security-sidebar" : "border-r border-line bg-surface"}`}>
        <Brand light={operationsMode} />
        <div className={`mt-8 px-3.5 py-3 ${operationsMode ? "security-access-card" : "border border-line bg-signal-soft"}`}>
          <span className={`font-mono text-[9px] tracking-[0.18em] ${operationsMode ? "text-white/55" : "text-muted"}`}>{operationsMode ? "AKSES SEBAGAI" : "MODE AKSES"}</span>
          <b className={`mt-1 block text-sm font-semibold ${operationsMode ? "text-white" : "text-ink"}`}>{roleTitle[role]}</b>
        </div>
        <nav className="mt-5 flex flex-col gap-1">
          {items.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 border-l-2 px-3 py-2.5 text-[13px] transition-colors ${operationsMode ? (isActive(href) ? "security-nav-active" : "border-transparent text-white/55 hover:bg-white/10 hover:text-white") : (
                isActive(href) ? "border-signal bg-signal-soft font-semibold text-ink" : "border-transparent text-muted hover:bg-signal-soft hover:text-ink"
              )
              }`}
            >
              <Icon size={17} strokeWidth={1.6} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className={`mt-auto pt-4 ${operationsMode ? "border-t border-white/10" : "border-t border-line"}`}>
          <div className="flex items-center gap-2.5 px-1 pb-3">
            <span aria-hidden className={`grid h-8 w-8 shrink-0 place-items-center text-[10px] font-bold ${operationsMode ? "rounded-lg bg-white/90 text-signal" : "border border-line bg-signal-soft text-navy"}`}>
              {initials(name)}
            </span>
            <span className="min-w-0">
              <b className={`block truncate text-[11px] font-semibold ${operationsMode ? "text-white" : "text-ink"}`}>{name}</b>
              <small className={operationsMode ? "text-[9px] text-white/55" : "text-[9px] text-muted"}>{roleTitle[role]}</small>
            </span>
          </div>
          <form action={logoutAction}>
            <button className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-[13px] transition-colors ${operationsMode ? "text-white/60 hover:bg-white/10 hover:text-white" : "text-muted hover:bg-signal-soft hover:text-ink"}`}>
              <LogOut size={16} strokeWidth={1.6} /> Keluar
            </button>
          </form>
        </div>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-20 flex justify-around border-t border-line bg-surface md:hidden">
        {items.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex min-w-16 flex-1 flex-col items-center gap-1 py-2.5 text-[9px] font-medium transition-colors active:text-signal ${isActive(href) ? "text-signal" : "text-muted"}`}
          >
            <Icon size={18} strokeWidth={1.6} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      <main className={`pb-24 md:pb-0 md:pl-64 ${operationsMode ? "security-main" : ""}`}>
        <header className={`flex min-h-[58px] items-center justify-between px-5 font-mono text-[10px] md:min-h-[62px] md:px-10 ${operationsMode ? "border-b border-[#dceef5] bg-white/85 text-muted backdrop-blur dark:border-line dark:bg-surface/85" : "border-b border-line text-muted"}`}>
          <span className={`flex items-center gap-2 ${operationsMode ? "font-sans text-sm font-bold text-ink" : "text-ink/70"}`}>
            {operationsMode && activeLabel}
            <i aria-hidden className="h-1.5 w-1.5 rounded-full bg-safe not-italic" />
            <span className={operationsMode ? "font-sans text-[11px] font-medium text-muted" : ""}>Sistem aktif</span>
          </span>
          <span className="flex items-center gap-3">
            <ThemeToggle />
            <NotificationCenter />
            {operationsMode ? <span className="grid h-9 w-9 place-items-center rounded-xl bg-signal-soft text-[10px] font-extrabold text-signal">{initials(name)}</span> : <span className="hidden sm:inline">{new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long" }).format(new Date())}</span>}
          </span>
        </header>
        {children}
      </main>
    </div>
  );
}
