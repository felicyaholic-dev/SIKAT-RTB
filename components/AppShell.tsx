"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, ClipboardPlus, DoorOpen, FileText, LayoutDashboard, LogOut, QrCode, ScanLine, UsersRound } from "lucide-react";
import type { Role } from "@/lib/db";
import { logoutAction } from "@/app/actions";
import { Brand } from "@/components/Brand";
import { initials } from "@/lib/ui";

type Item = { href: string; label: string; icon: typeof LayoutDashboard };

const nav: Record<Role, Item[]> = {
  STUDENT: [
    { href: "/student", label: "Beranda", icon: LayoutDashboard },
    { href: "/student/apply", label: "Ajukan izin", icon: ClipboardPlus },
    { href: "/student/permit", label: "Izin aktif", icon: QrCode },
    { href: "/student/history", label: "Riwayat", icon: FileText },
  ],
  SECURITY: [
    { href: "/security", label: "Validasi", icon: ScanLine },
    { href: "/security/outside", label: "Di luar RTB", icon: DoorOpen },
  ],
  MANAGER: [
    { href: "/manager", label: "Pemantauan", icon: LayoutDashboard },
    { href: "/manager/users", label: "Data user", icon: UsersRound },
    { href: "/manager/stats", label: "Statistik", icon: BarChart3 },
  ],
};

const roleTitle: Record<Role, string> = { STUDENT: "Mahasiswa", SECURITY: "Pos keamanan", MANAGER: "Pengelola RTB" };

export function AppShell({ role, name, children }: { role: Role; name: string; children: React.ReactNode }) {
  const items = nav[role];
  const pathname = usePathname();
  const isActive = (href: string) => href.split("#")[0] === pathname;
  return (
    <div className="min-h-screen bg-paper">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-line bg-surface p-5 md:flex">
        <Brand />
        <div className="mt-8 border border-line bg-signal-soft px-3.5 py-3">
          <span className="font-mono text-[9px] tracking-[0.18em] text-muted">MODE AKSES</span>
          <b className="mt-1 block text-sm font-semibold text-ink">{roleTitle[role]}</b>
        </div>
        <nav className="mt-5 flex flex-col gap-1">
          {items.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 border-l-2 px-3 py-2.5 text-[13px] transition-colors ${
                isActive(href) ? "border-signal bg-signal-soft font-semibold text-ink" : "border-transparent text-muted hover:bg-signal-soft hover:text-ink"
              }`}
            >
              <Icon size={17} strokeWidth={1.6} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="mt-auto border-t border-line pt-4">
          <div className="flex items-center gap-2.5 px-1 pb-3">
            <span aria-hidden className="grid h-8 w-8 shrink-0 place-items-center border border-line bg-signal-soft text-[10px] font-bold text-navy">
              {initials(name)}
            </span>
            <span className="min-w-0">
              <b className="block truncate text-[11px] font-semibold text-ink">{name}</b>
              <small className="text-[9px] text-muted">{roleTitle[role]}</small>
            </span>
          </div>
          <form action={logoutAction}>
            <button className="flex w-full items-center gap-2.5 px-3 py-2.5 text-[13px] text-muted transition-colors hover:bg-signal-soft hover:text-ink">
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

      <main className="pb-24 md:pb-0 md:pl-64">
        <header className="flex min-h-[58px] items-center justify-between border-b border-line px-5 font-mono text-[10px] text-muted md:min-h-[62px] md:px-10">
          <span className="flex items-center gap-2 text-ink/70">
            <i aria-hidden className="h-1.5 w-1.5 rounded-full bg-safe not-italic" />
            Sistem aktif
          </span>
          <span className="hidden sm:inline">{new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long" }).format(new Date())}</span>
        </header>
        {children}
      </main>
    </div>
  );
}
