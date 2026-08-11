import Link from "next/link";
import { ArrowRight, CheckCircle2, ClipboardCheck, LayoutDashboard, ScanLine, ShieldCheck, UserRound } from "lucide-react";
import { Brand, BrandMark } from "@/components/Brand";
import { PermitQr } from "@/components/PermitQr";
import { generateQrSvg } from "@/lib/qr";
import { btn } from "@/lib/ui";

const steps = [
  { no: "01", icon: ClipboardCheck, title: "Ajukan dengan ringkas", copy: "Mahasiswa mengisi tujuan dan perkiraan waktu tanpa memasukkan data identitas berulang." },
  { no: "02", icon: ScanLine, title: "Validasi di gerbang", copy: "Satpam memindai QR atau memasukkan kode izin dari satu layar yang cepat." },
  { no: "03", icon: CheckCircle2, title: "Status langsung tercatat", copy: "Waktu keluar, masuk, dan keterlambatan tersimpan sebagai satu riwayat yang jelas." },
] as const;

const roles = [
  { icon: UserRound, label: "Mahasiswa", title: "Ajukan izin tanpa antre lama", copy: "Buat izin, dapatkan QR, dan pantau status pengajuan." },
  { icon: ShieldCheck, label: "Satpam", title: "Validasi dalam satu langkah", copy: "Pindai kode, cek data, lalu konfirmasi keluar atau masuk." },
  { icon: LayoutDashboard, label: "Pengelola", title: "Pantau RTB secara langsung", copy: "Lihat keberadaan penghuni, keterlambatan, dan laporan." },
] as const;

export default async function LandingPage() {
  const qr = await generateQrSvg("SKT-7XQ2P");

  return (
    <main className="bg-paper">
      <header className="surface-glass sticky top-0 z-40 mx-auto flex h-20 w-full items-center justify-between px-6 lg:px-10">
        <span className="transition-transform duration-200 hover:scale-105">
          <Brand />
        </span>
        <nav className="flex items-center gap-7">
          <a href="#alur" className="relative hidden text-sm text-muted transition-colors hover:text-ink sm:inline [&:hover]:after:scale-x-100 after:absolute after:inset-x-0 after:-bottom-1 after:h-px after:origin-left after:scale-x-0 after:bg-signal after:transition-transform after:duration-200">
            Cara kerja
          </a>
          <a href="#peran" className="relative hidden text-sm text-muted transition-colors hover:text-ink sm:inline [&:hover]:after:scale-x-100 after:absolute after:inset-x-0 after:-bottom-1 after:h-px after:origin-left after:scale-x-0 after:bg-signal after:transition-transform after:duration-200">
            Untuk siapa
          </a>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 border border-line px-4 py-2.5 text-[13px] font-semibold text-ink transition-all duration-200 hover:-translate-y-0.5 hover:border-signal hover:text-signal hover:shadow-md"
          >
            Masuk sistem <ArrowRight size={14} strokeWidth={1.8} />
          </Link>
        </nav>
      </header>

      <section className="relative grid gap-14 overflow-hidden px-6 pt-6 pb-24 md:grid-cols-[1.05fr_0.95fr] md:items-center md:gap-10 md:pt-10 md:pb-28 lg:px-10">
        <span aria-hidden className="orb -top-24 -right-20 h-96 w-96 bg-signal/20" />
        <span aria-hidden className="orb top-1/2 -left-24 h-72 w-72 bg-signal-2/20" />
        <div className="relative">
          <p className="inline-flex items-center gap-2 border border-line px-3.5 py-1.5 text-xs font-semibold text-muted">
            <i aria-hidden className="h-1.5 w-1.5 rounded-full bg-safe not-italic" />
            Rumah Talenta BCA · Sistem operasional
          </p>
          <h1 className="mt-6 text-[clamp(2.75rem,8vw,4.75rem)] leading-[0.95] font-bold tracking-tight text-ink">
            Setiap langkah
            <br />
            keluar <span className="text-signal">tercatat.</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted">
            SIKAT RTB menyatukan izin mahasiswa, validasi pos keamanan, dan pemantauan pengelola dalam satu catatan yang dapat dipercaya.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-6">
            <Link href="/login" className={`${btn.base} ${btn.primary}`}>
              Masuk ke SIKAT <ArrowRight size={16} strokeWidth={1.8} />
            </Link>
            <a href="#alur" className="border-b border-muted/40 pb-0.5 text-sm font-medium text-ink transition-colors hover:border-ink">
              Lihat alurnya
            </a>
          </div>
          <dl className="mt-11 flex gap-9">
            <div>
              <dt className="text-xl font-bold">1 catatan</dt>
              <dd className="text-xs text-muted">untuk setiap izin</dd>
            </div>
            <div>
              <dt className="text-xl font-bold">&lt;10 dtk</dt>
              <dd className="text-xs text-muted">validasi di gerbang</dd>
            </div>
            <div>
              <dt className="text-xl font-bold">24/7</dt>
              <dd className="text-xs text-muted">status aktual RTB</dd>
            </div>
          </dl>
        </div>

        {/* A permit slip, freshly stamped — glass over the color orbs above,
            with a slow continuous bob so the hero never reads as static. */}
        <div className="group relative mx-auto w-full max-w-sm md:mx-0">
          <div
            className="hero-permit-card surface-glass relative p-6 shadow-[0_24px_60px_-20px_rgb(8_47_76_/_0.25)]"
            style={{ "--stub-bg": "color-mix(in oklab, white 80%, transparent)" } as React.CSSProperties}
          >
            <div className="flex items-center gap-2.5 border-b border-line pb-4">
              <BrandMark size={26} />
              <div>
                <small className="block font-mono text-[9px] tracking-wide text-muted">IZIN KELUAR-MASUK</small>
                <b className="text-sm">SIKAT RTB</b>
              </div>
            </div>
            <div className="flex items-center gap-3 py-4">
              <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center border border-line text-sm font-bold text-ink">
                FP
              </span>
              <div>
                <b className="block text-sm">Felda Putri H.</b>
                <small className="text-xs text-muted">BCA Learning 2025 · A128</small>
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-y-3 border-t border-line py-4 text-xs">
              <div>
                <dt className="text-muted">Tujuan</dt>
                <dd className="mt-0.5 font-semibold">Kota Kasablanka</dd>
              </div>
              <div>
                <dt className="text-muted">Kode izin</dt>
                <dd className="mt-0.5 font-mono font-semibold">SKT-7XQ2P</dd>
              </div>
              <div>
                <dt className="text-muted">Keluar</dt>
                <dd className="mt-0.5 font-semibold">16.00</dd>
              </div>
              <div>
                <dt className="text-muted">Kembali</dt>
                <dd className="mt-0.5 font-semibold">20.30</dd>
              </div>
            </dl>
            <div className="stub-edge flex items-center justify-between gap-4 pt-4">
              <p className="max-w-[130px] text-[11px] leading-relaxed text-muted">Tunjukkan QR ini kepada satpam di pos.</p>
              <PermitQr svg={qr} className="h-16 w-16" />
            </div>
          </div>
          <div
            aria-hidden
            className="animate-fade-up absolute -top-6 -right-6 rotate-[-10deg] text-signal transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-110"
            style={{ animationDelay: "0.15s" }}
          >
            <BrandMark tone="signal" size={80} />
          </div>
        </div>
      </section>

      <section id="alur" className="border-t border-line px-6 py-20 md:px-10 md:py-28">
        <p className="font-mono text-[11px] font-medium tracking-[0.1em] text-signal">CARA KERJA</p>
        <h2 className="mt-3 max-w-xl text-4xl font-semibold tracking-tight text-ink md:text-5xl">Satu alur yang sederhana untuk seluruh RTB.</h2>
        <div className="mt-14 grid gap-px overflow-hidden border border-line bg-line md:grid-cols-3">
          {steps.map(({ no, icon: Icon, title, copy }) => (
            <article key={no} className="group relative bg-paper p-8 transition-colors duration-200 hover:bg-signal-soft/40">
              <span className="absolute top-6 right-7 font-mono text-4xl text-line transition-colors duration-200 group-hover:text-signal/25">{no}</span>
              <span aria-hidden className="grid h-11 w-11 place-items-center border border-line text-ink transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-signal group-hover:bg-signal group-hover:text-white">
                <Icon size={20} strokeWidth={1.6} />
              </span>
              <h3 className="mt-7 text-lg font-semibold">{title}</h3>
              <p className="mt-2 max-w-[26ch] text-sm leading-relaxed text-muted">{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="peran" className="border-t border-line px-6 py-20 md:px-10 md:py-28">
        <p className="font-mono text-[11px] font-medium tracking-[0.1em] text-signal">SATU SISTEM · TIGA FOKUS</p>
        <h2 className="mt-3 max-w-xl text-4xl font-semibold tracking-tight text-ink md:text-5xl">Jelas untuk yang memakai. Tajam untuk yang bertugas.</h2>
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {roles.map(({ icon: Icon, label, title, copy }) => (
            <article key={label} className="group border border-line p-7 transition-all duration-200 hover:-translate-y-1 hover:border-signal hover:shadow-lg">
              <span aria-hidden className="grid h-11 w-11 place-items-center border border-line text-ink transition-all duration-200 group-hover:border-signal group-hover:bg-signal group-hover:text-white">
                <Icon size={19} strokeWidth={1.6} />
              </span>
              <small className="mt-6 block font-mono text-[10px] tracking-wide text-signal">{label.toUpperCase()}</small>
              <h3 className="mt-2 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="flex flex-col items-start gap-4 border-t border-line px-6 py-9 text-[13px] text-muted sm:flex-row sm:items-center sm:gap-6 md:px-10">
        <Brand />
        <p className="flex-1">Sistem Izin Keluar-Masuk Terintegrasi · Rumah Talenta BCA</p>
        <span className="text-xs text-muted/70">© 2026 SIKAT RTB</span>
      </footer>
    </main>
  );
}
