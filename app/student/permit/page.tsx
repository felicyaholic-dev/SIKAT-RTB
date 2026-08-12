import Link from "next/link";
import { Clock3, MapPin, QrCode } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PermitQr } from "@/components/PermitQr";
import { requireRole } from "@/lib/auth";
import { getStudentData } from "@/lib/db";
import { generateQrSvg } from "@/lib/qr";
import { btn, permitStatusLabel, permitTone, toneDot, toneText } from "@/lib/ui";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export default async function StudentPermitPage() {
  const session = await requireRole("STUDENT");
  const data = getStudentData(session.accountId);
  if (!data) return null;
  const { activePermit } = data;
  const isEntry = activePermit?.status === "MENUNGGU_MASUK";
  const hasQr = activePermit?.status === "MENUNGGU_KELUAR" || isEntry;
  const code = isEntry ? activePermit?.entry_code : activePermit?.permit_code;
  const qr = code && hasQr ? await generateQrSvg(code) : null;

  return (
    <AppShell role="STUDENT" name={session.name}>
      <div className="mx-auto max-w-6xl px-5 py-9 md:px-10 md:py-10">
        <header className="mb-7">
          <p className="font-mono text-[11px] tracking-[0.1em] text-signal">QR AKTIVITAS</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink md:text-4xl">{hasQr && code ? `#${code}` : activePermit ? "Sedang di luar RTB" : "Belum ada QR"}</h1>
          <p className="mt-1 text-sm text-muted">QR keluar dan QR masuk dibuat terpisah, lalu divalidasi satpam satu kali.</p>
        </header>

        <article className="max-w-xl border border-line bg-surface p-6">
          {activePermit && qr && code ? (
            <div>
              <div className="flex items-center justify-between gap-3 pb-4">
                <span className={`flex items-center gap-2 text-[13px] font-semibold ${toneText(permitTone(activePermit.status))}`}>
                  <i aria-hidden className={`h-1.5 w-1.5 rounded-full not-italic ${toneDot(permitTone(activePermit.status))}`} />
                  {permitStatusLabel(activePermit.status)}
                </span>
                <span className="shrink-0 text-right text-[11px] text-muted">{isEntry ? `Dibuat ${formatDate(activePermit.planned_return_at)}` : `Dibuat ${formatDate(activePermit.planned_departure_at)}`}</span>
              </div>

              <div className="border border-line">
                <div className="flex items-center justify-between border-b border-line px-5 py-3">
                  <small className="font-mono text-[10px] tracking-[0.14em] text-muted">{isEntry ? "QR MASUK RTB" : "QR KELUAR RTB"}</small>
                  <b className="font-mono text-sm tracking-wide">#{code}</b>
                </div>
                <div className="flex flex-col items-center gap-6 p-6">
                  <PermitQr svg={qr} className="h-52 w-52 sm:h-60 sm:w-60" />
                  <dl className="grid w-full max-w-xs grid-cols-2 gap-x-4 gap-y-3.5 text-[12px]">
                    <div className="col-span-2 text-center">
                      <dt className="flex items-center justify-center gap-1.5 text-muted">
                        <MapPin size={13} strokeWidth={1.6} /> Tujuan
                      </dt>
                      <dd className="mt-0.5 font-semibold">{activePermit.destination}</dd>
                    </div>
                    <div className="text-center">
                      <dt className="flex items-center justify-center gap-1.5 text-muted">
                        <Clock3 size={13} strokeWidth={1.6} /> {isEntry ? "Kembali" : "Keluar"}
                      </dt>
                      <dd className="mt-0.5 font-semibold">{formatDate(isEntry ? activePermit.planned_return_at : activePermit.planned_departure_at)}</dd>
                    </div>
                  </dl>
                </div>
                <div className="stub-edge px-5 pt-4 pb-4" style={{ "--stub-bg": "var(--color-surface)" } as React.CSSProperties}>
                  <p className="text-center text-[11px] text-muted">
                    Pindai atau masukkan kode: <b className="font-mono text-ink">{code}</b>
                  </p>
                </div>
              </div>

              <p className="mt-4 bg-amber-soft px-4 py-3 text-[12px] leading-relaxed text-amber">
                Jangan bagikan kode atau QR ini kepada siapa pun selain satpam di pos.
              </p>
            </div>
          ) : activePermit?.status === "SEDANG_DI_LUAR" ? (
            <div className="flex min-h-[160px] flex-col items-center justify-center gap-3 text-center text-sm text-muted"><Clock3 size={30} strokeWidth={1.6} className="text-signal" /><p>Kamu tercatat sedang di luar RTB.</p><Link href="/student/apply" className={`${btn.base} ${btn.safe} mt-1`}>Buat QR masuk</Link></div>
          ) : (
            <div className="flex min-h-[160px] flex-col items-center justify-center gap-3 text-center text-sm text-muted">
              <QrCode size={30} strokeWidth={1.6} className="text-signal" />
              <p>QR izin akan muncul di sini setelah pengajuan dibuat.</p>
              <Link href="/student/apply" className={`${btn.base} ${btn.primary} mt-1`}>
                Buat aktivitas
              </Link>
            </div>
          )}
        </article>
      </div>
    </AppShell>
  );
}
