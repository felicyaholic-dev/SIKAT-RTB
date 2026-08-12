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
  const { activePermit, resident } = data;
  const mode = activePermit?.status === "SEDANG_DI_LUAR" ? "ENTRY" : "EXIT";
  const waiting = activePermit?.status === "MENUNGGU_KELUAR" || activePermit?.status === "MENUNGGU_MASUK";
  const isEntry = mode === "ENTRY";

  return (
    <AppShell role="STUDENT" name={session.name}>
      <div className="mx-auto max-w-[1180px] px-5 py-9 md:px-10 md:py-11">
        <header className="mb-6"><p className="font-mono text-[11px] font-bold tracking-[0.13em] text-signal">AKTIVITAS MAHASISWA</p><h1 className="mt-2 text-[clamp(2rem,4vw,3rem)] font-medium tracking-[-0.055em] text-ink">{isEntry ? "Konfirmasi kembali ke RTB" : "Ajukan izin keluar"}</h1><p className="mt-1 text-sm text-muted">{isEntry ? "Buat QR masuk baru sebelum kembali ke gerbang RTB." : "Lengkapi informasi izin untuk membuat QR keluar."}</p></header>
        <article>
          {waiting ? (
            <p className="mb-5 flex flex-wrap items-center justify-between gap-3 bg-amber-soft px-4 py-3 text-[13px] text-amber">
              QR {activePermit.status === "MENUNGGU_MASUK" ? "masuk" : "keluar"} masih menunggu validasi satpam.
              <Link href="/student/permit" className="inline-flex items-center gap-1 font-semibold hover:underline">
                Lihat QR <ArrowRight size={14} strokeWidth={1.8} />
              </Link>
            </p>
          ) : <PermitForm mode={mode} student={resident} />}
        </article>
      </div>
    </AppShell>
  );
}
