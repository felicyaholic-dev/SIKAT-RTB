import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardPlus,
  Clock3,
  LayoutDashboard,
  LogIn,
  ScanLine,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Brand } from "@/components/Brand";
import { LoginModalProvider, LoginTrigger } from "@/components/LoginModal";
import { PermitQr } from "@/components/PermitQr";
import { generateQrSvg } from "@/lib/qr";

const steps = [
  { no: "01", icon: ClipboardPlus, title: "Ajukan izin", copy: "Mahasiswa melengkapi jenis izin, tanggal, jam keluar, dan keterangan. Identitas muncul otomatis." },
  { no: "02", icon: ScanLine, title: "Pindai kode", copy: "Satpam memindai QR aktif pada satu perangkat, lalu memeriksa data pengajuan." },
  { no: "03", icon: CheckCircle2, title: "Status diperbarui", copy: "Setelah diizinkan, status keberadaan dan waktu keluar-masuk langsung tercatat." },
] as const;

const roles = [
  { icon: UserRound, label: "MAHASISWA", title: "Ajukan izin tanpa antre lama", copy: "Buat izin, dapatkan QR, dan pantau status pengajuan." },
  { icon: ShieldCheck, label: "SATPAM", title: "Validasi dalam satu langkah", copy: "Pindai kode, cek data, lalu izinkan atau tolak." },
  { icon: LayoutDashboard, label: "PENGELOLA", title: "Pantau RTB secara langsung", copy: "Lihat keberadaan penghuni, aktivitas, dan laporan." },
] as const;

export default async function LandingPage() {
  const qr = await generateQrSvg("SKT-0824-FELDA");

  return (
    <LoginModalProvider><main className="landing-page overflow-hidden bg-paper">
      <section className="hero-stage relative isolate overflow-hidden">
        <i aria-hidden className="hero-glow hero-glow-one" />
        <i aria-hidden className="hero-glow hero-glow-two" />
        <i aria-hidden className="hero-grid" />

        <header className="relative z-10 mx-auto flex h-24 w-full max-w-6xl items-center justify-between px-6 lg:px-0">
          <Link href="/" aria-label="SIKAT RTB - beranda" className="transition-transform duration-300 hover:scale-[1.035]"><Brand /></Link>
          <nav className="flex items-center gap-5 sm:gap-8">
            <a href="#alur" className="hidden text-sm font-semibold text-muted transition-colors hover:text-ink sm:block">Cara kerja</a>
            <a href="#peran" className="hidden text-sm font-semibold text-muted transition-colors hover:text-ink sm:block">Fitur</a>
            <LoginTrigger className="inline-flex items-center gap-2 rounded-[14px] border border-line bg-white/80 px-4 py-3 text-sm font-bold text-signal shadow-[0_8px_22px_rgb(8_105_164_/_0.10)] transition-all duration-300 hover:-translate-y-0.5 hover:border-signal hover:bg-white hover:shadow-[0_12px_28px_rgb(8_140_255_/_0.20)]">
              <LogIn size={16} /> <span className="hidden xs:inline">Masuk sistem</span><span className="xs:hidden">Masuk</span>
            </LoginTrigger>
          </nav>
        </header>

        <div className="relative z-[1] mx-auto grid min-h-[600px] max-w-6xl items-center gap-14 px-6 pb-24 pt-10 md:grid-cols-[0.94fr_1.06fr] lg:min-h-[620px] lg:px-0">
          <div className="landing-reveal max-w-xl" style={{ animationDelay: "120ms" }}>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/55 px-3 py-1.5 text-[11px] font-bold text-muted shadow-sm backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-safe shadow-[0_0_0_4px_rgb(7_140_255_/_0.11)]" />
              Rumah Talenta BCA · Sistem terintegrasi
            </p>
            <h1 className="mt-6 text-[clamp(3.1rem,6.3vw,5.5rem)] font-extrabold leading-[0.92] tracking-[-0.075em] text-ink">
              Satu izin.<br /><span className="sky-text">Satu validasi.</span><br />Langsung tercatat.
            </h1>
            <p className="mt-7 max-w-[34rem] text-[15px] leading-7 text-muted sm:text-base">
              SIKAT RTB menyatukan pengajuan mahasiswa, validasi satpam, dan pemantauan pengelola dalam satu alur yang cepat, aman, dan mudah dipahami.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <LoginTrigger className="inline-flex items-center gap-2 rounded-xl bg-signal px-5 py-3.5 text-sm font-bold text-white shadow-[0_12px_24px_rgb(8_140_255_/_0.29)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#007ce8] hover:shadow-[0_17px_30px_rgb(8_140_255_/_0.36)]">Masuk ke sistem <ArrowRight size={17} /></LoginTrigger>
              <a href="#alur" className="inline-flex items-center gap-2 rounded-xl border border-line bg-white/55 px-5 py-3.5 text-sm font-bold text-ink transition-all duration-300 hover:-translate-y-0.5 hover:border-signal hover:bg-white">Lihat cara kerja</a>
            </div>
            <dl className="mt-11 flex flex-wrap gap-x-9 gap-y-4">
              <div><dt className="text-xl font-extrabold tracking-tight text-ink">1×</dt><dd className="mt-0.5 text-[11px] font-medium text-muted">input data</dd></div>
              <div><dt className="text-xl font-extrabold tracking-tight text-ink">&lt;10 dtk</dt><dd className="mt-0.5 text-[11px] font-medium text-muted">validasi cepat</dd></div>
              <div><dt className="text-xl font-extrabold tracking-tight text-ink">24/7</dt><dd className="mt-0.5 text-[11px] font-medium text-muted">status terpantau</dd></div>
            </dl>
          </div>

          <div className="permit-showcase landing-reveal relative mx-auto w-full max-w-[510px]" style={{ animationDelay: "260ms" }}>
            <div aria-hidden className="hero-rings h-[610px] w-[610px] rounded-full" />
            <div aria-hidden className="hero-orbit h-[540px] w-[540px] rounded-full" />
            <div className="permit-window relative z-10 w-full max-w-[430px] rounded-[30px] border border-white/80 bg-white/75 p-4 shadow-[0_30px_70px_rgb(9_97_146_/_0.20)] backdrop-blur-xl sm:p-5">
              <div className="flex items-center justify-between rounded-2xl bg-sky-50 px-4 py-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#d8f2ff] text-signal"><ShieldCheck size={20} /></span>
                <p className="text-right text-[10px] leading-tight text-muted">Pengajuan aktif<br /><b className="text-xs text-ink">SIKAT RTB</b></p>
              </div>
              <div className="flex items-center gap-3 py-4">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e2f5ff] text-xs font-extrabold text-signal">FP</span>
                <span><b className="block text-sm text-ink">Felda Putri Herlastuti</b><small className="text-[11px] text-muted">PPBP 9 · Kamar A128</small></span>
                <span className="ml-auto h-3 w-3 rounded-full bg-signal shadow-[0_0_0_5px_rgb(7_140_255_/_0.12)]" />
              </div>
              <div className="permit-ticket relative overflow-hidden rounded-[20px] p-5 text-white">
                <span className="absolute -right-8 -top-12 h-36 w-36 rounded-full border-[20px] border-white/10" />
                <div className="relative flex items-start justify-between text-[10px] font-semibold"><span>IZIN KELUAR</span><span>#SKT-0824</span></div>
                <div className="relative mx-auto mt-5 grid w-fit place-items-center rounded-xl bg-white p-2.5 shadow-lg"><PermitQr svg={qr} className="h-28 w-28" /></div>
                <p className="relative mt-3 text-center text-[9px] text-white/80">Tunjukkan kode ini kepada satpam</p>
              </div>
              <div className="flex items-center justify-between px-2 pt-3 text-[10px] text-muted"><span>Penggunaan</span><b className="text-sm text-ink">1 kali</b></div>
            </div>

            <div className="float-badge absolute z-20 -right-5 top-5 flex items-center gap-2 rounded-2xl border border-white/80 bg-white/95 px-3 py-3 shadow-[0_12px_26px_rgb(5_75_113_/_0.15)] sm:-right-9"><span className="grid h-9 w-9 place-items-center rounded-xl bg-safe-soft text-safe"><CheckCircle2 size={19} /></span><p className="text-[10px] leading-4 text-muted"><b className="block text-xs text-ink">Tervalidasi</b>Data tercatat otomatis</p></div>
            <div className="float-badge float-badge-late absolute z-20 -left-7 bottom-7 flex items-center gap-2 rounded-2xl border border-white/80 bg-white/95 px-3 py-3 shadow-[0_12px_26px_rgb(5_75_113_/_0.15)] sm:-left-14"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#e2f5ff] text-signal"><Clock3 size={18} /></span><p className="text-[10px] leading-4 text-muted"><b className="block text-xs text-ink">Kedaluwarsa otomatis</b>QR aman digunakan</p></div>
          </div>
        </div>
      </section>

      <section id="alur" className="relative px-6 py-24 lg:px-0 lg:py-32">
        <div className="mx-auto max-w-6xl">
          <p className="eyebrow">CARA KERJA</p>
          <h2 className="mt-4 max-w-3xl text-[clamp(2.35rem,4.5vw,4.15rem)] font-medium leading-[1.1] tracking-[-0.055em] text-ink">Dari pengajuan hingga tercatat, <br className="hidden md:block" />cukup tiga langkah.</h2>
          <div className="mt-14 grid gap-4 md:grid-cols-3">
            {steps.map(({ no, icon: Icon, title, copy }, index) => <article className="flow-card landing-reveal group relative min-h-[250px] overflow-hidden rounded-[22px] border border-line bg-white p-7" style={{ animationDelay: `${index * 90}ms` }} key={no}>
              <span className="absolute right-6 top-4 text-5xl font-bold tracking-[-0.1em] text-[#eaf6ff] transition-colors duration-300 group-hover:text-[#c4eaff]">{no}</span>
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#e4f5ff] text-signal transition-all duration-300 group-hover:-translate-y-1 group-hover:bg-signal group-hover:text-white"><Icon size={20} /></span>
              <h3 className="mt-11 text-lg font-medium tracking-tight text-ink">{title}</h3><p className="mt-2 max-w-[32ch] text-sm leading-6 text-muted">{copy}</p>
            </article>)}
          </div>
        </div>
      </section>

      <section id="peran" className="role-stage relative overflow-hidden px-6 py-24 lg:px-0 lg:py-28">
        <i aria-hidden className="role-orb" />
        <div className="relative mx-auto max-w-6xl text-center">
          <p className="eyebrow">AKSES AMAN</p><h2 className="mt-3 text-[clamp(2.25rem,4vw,3.7rem)] font-medium tracking-[-0.055em] text-ink">Masuk sesuai role pengguna</h2><p className="mt-2 text-sm text-muted">Setiap akun hanya dapat membuka fitur yang sesuai dengan role-nya.</p>
          <div className="mt-10 grid gap-4 text-left md:grid-cols-3">
            {roles.map(({ icon: Icon, label, title, copy }, index) => <LoginTrigger key={label} className="role-card landing-reveal group w-full rounded-[21px] border border-line bg-white/80 p-6 text-left shadow-[0_8px_25px_rgb(4_82_122_/_0.04)] transition-all duration-300 hover:-translate-y-2 hover:border-signal hover:bg-white hover:shadow-[0_20px_34px_rgb(4_126_192_/_0.14)]" ariaLabel={`Masuk ke sistem sebagai akun ${label.toLowerCase()}`}>
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#e4f5ff] text-ink transition-all duration-300 group-hover:bg-signal group-hover:text-white"><Icon size={19} /></span>
              <span className="mt-7 block text-[10px] font-extrabold tracking-wider text-[#1687c7]">{label}</span><h3 className="mt-2 text-lg font-medium tracking-tight text-ink">{title}</h3><p className="mt-1.5 text-[13px] leading-5 text-muted">{copy}</p>
              <span className="mt-6 flex items-center justify-between text-[11px] font-bold text-ink">Masuk sebagai {label[0] + label.slice(1).toLowerCase()} <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" /></span>
            </LoginTrigger>)}
          </div>
        </div>
      </section>

      <section className="closing-band relative overflow-hidden px-6 py-20 lg:px-0">
        <i aria-hidden className="closing-shine" />
        <div className="relative mx-auto flex max-w-6xl flex-col justify-between gap-12 md:flex-row md:items-end">
          <div><p className="eyebrow text-[#98dcff]">TANPA INPUT GANDA</p><h2 className="mt-5 max-w-md text-[clamp(2.4rem,4.4vw,4.3rem)] font-medium leading-[1.03] tracking-[-0.06em] text-white">Lebih cepat untuk satpam.<br />Lebih nyaman untuk mahasiswa.</h2></div>
          <p className="max-w-sm text-sm leading-6 text-white/70">Satu sumber data membuat status penghuni lebih akurat, antrean berkurang, dan setiap aktivitas mudah ditelusuri.</p>
        </div>
      </section>

      <footer className="bg-[#064b76] px-6 py-7 lg:px-0"><div className="mx-auto flex max-w-6xl flex-col gap-5 text-[11px] text-white/55 sm:flex-row sm:items-center"><Brand light /><p className="flex-1">Sistem Izin Keluar-Masuk Terintegrasi RTB</p><span>© 2026 SIKAT RTB</span></div></footer>
    </main></LoginModalProvider>
  );
}
