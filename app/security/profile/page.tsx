import { BadgeCheck, Building2, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { MobileProfileLogout } from "@/components/MobileProfileLogout";
import { requireRole } from "@/lib/auth";
import { initials } from "@/lib/ui";

export default async function SecurityProfilePage() {
  const session = await requireRole("SECURITY");
  return (
    <AppShell role="SECURITY" name={session.name}>
      <div className="security-page mx-auto max-w-[900px] px-5 py-9 md:px-10 md:py-11">
        <header className="mb-7"><p className="security-kicker">SATPAM</p><h1 className="mt-2 text-[clamp(2rem,4vw,3.15rem)] font-medium tracking-[-0.06em] text-ink">Profil Satpam</h1><p className="mt-2 text-sm text-muted">Informasi petugas yang sedang menggunakan sistem.</p></header>
        <section className="security-profile-hero security-card p-6 sm:p-8"><span className="grid h-24 w-24 shrink-0 place-items-center rounded-[28px] bg-gradient-to-br from-[#ddf7ff] to-[#bfe7ff] text-2xl font-extrabold text-signal shadow-[inset_0_0_0_3px_white]">{initials(session.name)}</span><div><span className="inline-flex items-center gap-1 rounded-full bg-safe-soft px-2.5 py-1 text-[10px] font-extrabold tracking-wider text-safe"><ShieldCheck size={12} /> SATPAM</span><h2 className="mt-3 text-2xl font-medium tracking-tight text-ink">{session.name}</h2><p className="mt-1 text-sm text-muted">ID BCA {session.bcaId}</p><p className="mt-5 flex items-center gap-2 text-[11px] text-muted"><BadgeCheck size={15} className="text-signal" /> Akun aktif dan terverifikasi</p></div></section>
        <section className="security-card mt-5 p-6 sm:p-8"><p className="security-kicker">INFORMASI AKUN</p><div className="mt-5 grid gap-5 sm:grid-cols-2"><label>Nama lengkap<input value={session.name} readOnly /></label><label>ID BCA<input value={session.bcaId} readOnly /></label></div><p className="mt-6 flex items-center gap-2 border-t border-line pt-5 text-[12px] text-muted"><Building2 size={16} className="text-signal" /> Perubahan profil dikelola oleh Pengelola RTB.</p></section>
        <MobileProfileLogout />
      </div>
    </AppShell>
  );
}
