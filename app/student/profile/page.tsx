import { BadgeCheck, GraduationCap } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { MobileProfileLogout } from "@/components/MobileProfileLogout";
import { StudentContactForm } from "@/app/student/StudentContactForm";
import { requireRole } from "@/lib/auth";
import { getStudentData } from "@/lib/db";
import { initials } from "@/lib/ui";

export default async function StudentProfilePage() {
  const session = await requireRole("STUDENT");
  const data = getStudentData(session.accountId);
  if (!data) return null;
  const { resident } = data;

  return (
    <AppShell role="STUDENT" name={session.name}>
      <div className="mx-auto max-w-[900px] px-5 py-9 md:px-10 md:py-11">
        <header className="mb-7">
          <p className="font-mono text-[11px] font-bold tracking-[0.13em] text-signal">MAHASISWA</p>
          <h1 className="mt-2 text-[clamp(2rem,4vw,3.15rem)] font-medium tracking-[-0.06em] text-ink">Profil Mahasiswa</h1>
          <p className="mt-2 text-sm text-muted">Informasi akun dan data hunianmu di RTB.</p>
        </header>
        <section className="security-profile-hero security-card p-6 sm:p-8">
          <span className="grid h-24 w-24 shrink-0 place-items-center rounded-[28px] bg-gradient-to-br from-[#ddf7ff] to-[#bfe7ff] text-2xl font-extrabold text-signal shadow-[inset_0_0_0_3px_white]">{initials(resident.full_name)}</span>
          <div>
            <span className="inline-flex items-center gap-1 rounded-full bg-safe-soft px-2.5 py-1 text-[10px] font-extrabold tracking-wider text-safe"><GraduationCap size={12} /> MAHASISWA</span>
            <h2 className="mt-3 text-2xl font-medium tracking-tight text-ink">{resident.full_name}</h2>
            <p className="mt-1 text-sm text-muted">ID BCA {session.bcaId}</p>
            <p className="mt-5 flex items-center gap-2 text-[11px] text-muted"><BadgeCheck size={15} className="text-signal" /> Akun aktif dan terverifikasi</p>
          </div>
        </section>
        <section className="security-card mt-5 p-6 sm:p-8">
          <p className="security-kicker">DATA HUNIAN</p>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <label>Nama lengkap<input value={resident.full_name} readOnly /></label>
            <label>ID BCA<input value={session.bcaId} readOnly /></label>
            <label>Kelas<input value={resident.class_name} readOnly /></label>
          </div>
          <p className="mt-6 flex items-center gap-2 border-t border-line pt-5 text-[12px] text-muted"><BadgeCheck size={16} className="text-signal" /> Nama, ID BCA, dan kelas dikelola oleh Pengelola RTB.</p>
        </section>
        <StudentContactForm room={resident.room_number} phoneNumber={resident.phone_number} email={resident.email} />
        <MobileProfileLogout />
      </div>
    </AppShell>
  );
}
