import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { requireRole } from "@/lib/auth";
import { getStudentData } from "@/lib/db";
import { PermitForm } from "../PermitForm";

export default async function StudentApplyPage() {
  const session = await requireRole("STUDENT");
  const data = getStudentData(session.accountId);
  if (!data) return null;
  const { activePermit } = data;

  return (
    <AppShell role="STUDENT" name={session.name}>
      <div className="mx-auto max-w-6xl px-5 py-9 md:px-10 md:py-10">
        <header className="mb-7">
          <p className="font-mono text-[11px] tracking-[0.1em] text-signal">PENGAJUAN BARU</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink md:text-4xl">Mau keluar ke mana?</h1>
          <p className="mt-1 text-sm text-muted">Isi tujuan dan rencana waktu, QR izin dibuat otomatis setelah dikirim.</p>
        </header>

        <article className="max-w-xl border border-line bg-surface p-6">
          {activePermit && (
            <p className="mb-5 flex flex-wrap items-center justify-between gap-3 bg-amber-soft px-4 py-3 text-[13px] text-amber">
              Masih ada izin aktif yang berjalan.
              <Link href="/student/permit" className="inline-flex items-center gap-1 font-semibold hover:underline">
                Lihat izin aktif <ArrowRight size={14} strokeWidth={1.8} />
              </Link>
            </p>
          )}
          <PermitForm disabled={Boolean(activePermit)} />
        </article>
      </div>
    </AppShell>
  );
}
