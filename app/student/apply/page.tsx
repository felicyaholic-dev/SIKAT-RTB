import { AppShell } from "@/components/AppShell";
import { requireRole } from "@/lib/auth";
import { currentPermitCode, getStudentData } from "@/lib/db";
import { generateQrSvg } from "@/lib/qr";
import { ActivePermitCard } from "../ActivePermitCard";
import { PermitForm } from "../PermitForm";
import { StudentPermitDecisionWatcher } from "../StudentPermitDecisionWatcher";

export default async function StudentApplyPage() {
  const session = await requireRole("STUDENT");
  const data = getStudentData(session.accountId);
  if (!data) return null;
  const { activePermit, resident, history, latestDecision } = data;
  const mode = activePermit?.status === "SEDANG_DI_LUAR" ? "ENTRY" : "EXIT";
  const waiting = activePermit?.status === "MENUNGGU_KELUAR" || activePermit?.status === "MENUNGGU_MASUK";
  const isEntry = mode === "ENTRY";
  const pendingCode = activePermit ? currentPermitCode(activePermit) : null;
  const qr = waiting && pendingCode ? await generateQrSvg(pendingCode) : null;
  const decisionPermitId = activePermit?.id ?? history[0]?.id ?? null;

  return (
    <AppShell role="STUDENT" name={session.name}>
      <div className="mx-auto max-w-[1180px] px-5 py-9 md:px-10 md:py-11">
        <header className="mb-6"><p className="font-mono text-[11px] font-bold tracking-[0.13em] text-signal">AKTIVITAS MAHASISWA</p><h1 className="mt-2 text-[clamp(2rem,4vw,3rem)] font-medium tracking-[-0.055em] text-ink">{waiting ? "QR menunggu keputusan" : isEntry ? "Konfirmasi kembali ke RTB" : "Ajukan izin keluar"}</h1><p className="mt-1 text-sm text-muted">{waiting ? "Tunjukkan QR ini kepada satpam. Kamu masih dapat membatalkannya sebelum diproses." : isEntry ? "Buat QR masuk baru sebelum kembali ke gerbang RTB." : "Lengkapi informasi izin untuk membuat QR keluar."}</p></header>
        {waiting && activePermit && qr && pendingCode ? <ActivePermitCard permit={activePermit} qr={qr} code={pendingCode} latestDecision={latestDecision ?? null} /> : <div className="relative"><PermitForm mode={mode} student={resident} /><StudentPermitDecisionWatcher permitId={decisionPermitId} initialDecision={latestDecision ?? null} /></div>}
      </div>
    </AppShell>
  );
}
