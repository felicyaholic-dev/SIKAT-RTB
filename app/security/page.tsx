import { Search, ShieldCheck, TriangleAlert } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { requireRole } from "@/lib/auth";
import { getPermitForSecurity } from "@/lib/db";
import { btn } from "@/lib/ui";
import { ValidatePermit } from "./ValidatePermit";
import { QrScanner } from "./QrScanner";

type Props = { searchParams: Promise<{ code?: string }> };

export default async function SecurityPage({ searchParams }: Props) {
  const session = await requireRole("SECURITY");
  const { code } = await searchParams;
  const permit = code ? getPermitForSecurity(code) : undefined;
  return (
    <AppShell role="SECURITY" name={session.name}>
      <div className="mx-auto max-w-6xl px-5 py-9 md:px-10 md:py-10">
        <header className="mb-7">
          <p className="font-mono text-[11px] tracking-[0.1em] text-signal">POS UTAMA · SHIFT AKTIF</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink md:text-4xl">Validasi cepat.</h1>
          <p className="mt-1 text-sm text-muted">Pindai QR izin atau masukkan kode untuk mencatat pergerakan mahasiswa.</p>
        </header>

        <section className="grid gap-5 md:grid-cols-2">
          <div className="bg-hero-sky border border-line p-5">
            <QrScanner />
            <form className="mt-5" action="/security">
              <label htmlFor="code" className="text-muted">
                Kode izin
              </label>
              <div className="mt-2 flex gap-2">
                <input id="code" name="code" defaultValue={code} placeholder="Contoh: SKT-8J7K2" />
                <button className={`${btn.base} ${btn.primary} shrink-0 px-4`}>
                  <Search size={16} strokeWidth={1.8} /> Cari
                </button>
              </div>
            </form>
          </div>

          <div className="min-w-0">
            {code && !permit && (
              <div className="grid min-h-[366px] place-items-center border border-line bg-surface p-8 text-center">
                <div className="grid justify-items-center gap-2 text-muted">
                  <TriangleAlert size={28} strokeWidth={1.6} className="text-signal" />
                  <h2 className="text-xl font-semibold text-ink">Izin tidak ditemukan</h2>
                  <p className="max-w-[250px] text-[13px] leading-relaxed">Periksa kembali kode, atau gunakan QR yang diberikan mahasiswa.</p>
                </div>
              </div>
            )}
            {permit && <ValidatePermit permit={permit} />}
            {!code && (
              <div className="grid min-h-[366px] place-items-center border border-line bg-surface p-8 text-center">
                <div className="grid justify-items-center gap-2 text-muted">
                  <ShieldCheck size={28} strokeWidth={1.6} className="text-signal" />
                  <h2 className="text-xl font-semibold text-ink">Menunggu pemindaian</h2>
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
