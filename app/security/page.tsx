import { QrCode, Search, ShieldCheck, TriangleAlert } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { requireRole } from "@/lib/auth";
import { getPermitForSecurity } from "@/lib/db";
import { ValidatePermit } from "./ValidatePermit";
import { QrScanner } from "./QrScanner";

type Props = { searchParams: Promise<{ code?: string }> };

export default async function SecurityPage({ searchParams }: Props) {
  const session = await requireRole("SECURITY");
  const { code } = await searchParams;
  const permit = code ? getPermitForSecurity(code) : undefined;
  return (
    <AppShell role="SECURITY" name={session.name}>
      <div className="security-page mx-auto max-w-[1280px] px-5 py-9 md:px-10 md:py-11">
        <header className="mb-7">
          <p className="security-kicker">SATPAM</p>
          <h1 className="mt-2 text-[clamp(2rem,4vw,3.15rem)] font-medium tracking-[-0.06em] text-ink">Validasi</h1>
          <p className="mt-2 text-sm text-muted">Pindai QR mahasiswa, periksa data, lalu berikan keputusan.</p>
        </header>

        <section className="grid gap-5 xl:grid-cols-[1.04fr_.96fr]">
          <div className="security-card p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3"><span className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#e1f6ff] text-signal"><QrCode size={21} /></span><span><b className="block text-sm text-ink">Pindai QR</b><small className="text-[10px] text-muted">Arahkan kamera ke kode mahasiswa</small></span></span></div>
            <QrScanner />
            <form className="mt-5" action="/security">
              <label htmlFor="code" className="sr-only">Kode pengajuan</label>
              <p className="mb-2 text-center text-[10px] text-muted">Atau masukkan kode pengajuan</p>
              <div className="flex gap-2">
                <input id="code" name="code" defaultValue={code} placeholder="Contoh: SKT-8J7K2" />
                <button className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-signal px-4 text-xs font-bold text-white shadow-[0_8px_16px_rgb(7_140_255_/_0.25)] transition-all hover:-translate-y-0.5 hover:bg-[#007ce8]">
                  <Search size={16} strokeWidth={1.8} /> Periksa <span className="hidden sm:inline">kode</span>
                </button>
              </div>
            </form>
          </div>

          <div className="min-w-0">
            {code && !permit && (
              <div className="security-card grid min-h-[470px] place-items-center p-8 text-center">
                <div className="grid justify-items-center gap-2 text-muted">
                  <span className="grid h-16 w-16 place-items-center rounded-[22px] bg-[#fff4de] text-amber"><TriangleAlert size={28} strokeWidth={1.6} /></span>
                  <h2 className="mt-3 text-xl font-medium tracking-tight text-ink">Izin tidak ditemukan</h2>
                  <p className="max-w-[250px] text-[13px] leading-relaxed">Periksa kembali kode, atau gunakan QR yang diberikan mahasiswa.</p>
                </div>
              </div>
            )}
            {permit && <ValidatePermit permit={permit} />}
            {!code && (
              <div className="security-card grid min-h-[470px] place-items-center p-8 text-center">
                <div className="grid justify-items-center gap-2 text-muted">
                  <span className="security-wait-icon grid h-16 w-16 place-items-center rounded-[22px] bg-safe-soft text-safe"><ShieldCheck size={29} strokeWidth={1.6} /></span>
                  <h2 className="mt-3 text-xl font-medium tracking-tight text-ink">Menunggu kode pengajuan</h2>
                  <p className="max-w-[250px] text-[13px] leading-relaxed">Data mahasiswa akan muncul di sini setelah QR atau kode izin ditemukan.</p>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
