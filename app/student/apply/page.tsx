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
  const mode = activePermit?.status === "SEDANG_DI_LUAR" ? "ENTRY" : "EXIT";
  const waiting = activePermit?.status === "MENUNGGU_KELUAR" || activePermit?.status === "MENUNGGU_MASUK";
  const isEntry = mode === "ENTRY";

  return (
    <AppShell role="STUDENT" name={session.name}>
      <div className="mx-auto max-w-6xl px-5 py-9 md:px-10 md:py-10">
        <header className="mb-7">
          <p className="font-mono text-[11px] tracking-[0.1em] text-signal">AKTIVITAS RTB</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink md:text-4xl">{isEntry ? "Sudah kembali ke RTB?" : "Mau keluar ke mana?"}</h1>
          <p className="mt-1 text-sm text-muted">{isEntry ? "Buat QR masuk baru, lalu tunjukkan kepada satpam di gerbang." : "Isi tujuan dan waktu keluar. QR dibuat otomatis setelah form dikirim."}</p>
        </header>

        <article className="max-w-xl border border-line bg-surface p-6">
          {waiting ? (
            <p className="mb-5 flex flex-wrap items-center justify-between gap-3 bg-amber-soft px-4 py-3 text-[13px] text-amber">
              QR {activePermit.status === "MENUNGGU_MASUK" ? "masuk" : "keluar"} masih menunggu validasi satpam.
              <Link href="/student/permit" className="inline-flex items-center gap-1 font-semibold hover:underline">
                Lihat QR <ArrowRight size={14} strokeWidth={1.8} />
              </Link>
            </p>
          ) : <PermitForm mode={mode} />}
        </article>
      </div>
    </AppShell>
  );
}
