import { AlertTriangle, ArrowUpRight, Building2, CheckCircle2, Clock3, DoorOpen, LogIn, LogOut, type LucideIcon } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { requireRole } from "@/lib/auth";
import { getReport, type ReportPeriod } from "@/lib/db";

const statTone = {
  safe: "bg-safe-soft text-safe",
  blue: "bg-signal-soft text-signal",
  danger: "bg-danger-soft text-danger",
  ink: "bg-mist text-navy",
} as const;

const periods: Array<{ value: ReportPeriod; label: string; description: string }> = [
  { value: "DAY", label: "Hari ini", description: "Aktivitas sejak pukul 00.00 hari ini" },
  { value: "WEEK", label: "7 hari", description: "Aktivitas tujuh hari terakhir" },
  { value: "MONTH", label: "Bulan ini", description: "Aktivitas sejak awal bulan" },
];

export default async function ManagerStatsPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const session = await requireRole("MANAGER");
  const { period: selectedPeriod } = await searchParams;
  const period = periods.some((item) => item.value === selectedPeriod) ? selectedPeriod as ReportPeriod : "DAY";
  const periodMeta = periods.find((item) => item.value === period)!;
  const report = getReport(period);

  return (
    <AppShell role="MANAGER" name={session.name}>
      <div className="security-page mx-auto max-w-[1280px] px-5 py-9 md:px-10 md:py-11">
        <header className="mb-7 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="security-kicker">PENGELOLA</p>
            <h1 className="mt-2 text-[clamp(2rem,4vw,3.15rem)] font-medium tracking-[-0.06em] text-ink">Laporan</h1>
            <p className="mt-2 text-sm text-muted">{periodMeta.description} dan unduhan laporan.</p>
          </div>
          <span className="rounded-pill bg-mist px-3 py-2 font-mono text-[10px] tracking-wide text-muted">{periodMeta.label.toUpperCase()}</span>
        </header>

        <nav className="mb-5 inline-flex rounded-2xl border border-line bg-white p-1.5 shadow-[0_8px_20px_rgb(11_103_146_/_0.05)]" aria-label="Periode laporan">
          {periods.map((item) => <a key={item.value} href={`/manager/stats?period=${item.value}`} className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${period === item.value ? "bg-signal text-white shadow-[0_6px_14px_rgb(7_140_255_/_0.22)]" : "text-muted hover:bg-mist hover:text-ink"}`}>{item.label}</a>)}
        </nav>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat icon={Building2} label="Pengajuan periode" value={report.summary.permits} note="izin tercatat" tone="safe" />
          <Stat icon={DoorOpen} label="Keluar RTB" value={report.summary.exits} note="validasi keluar" tone="blue" />
          <Stat icon={LogIn} label="Kembali ke RTB" value={report.summary.entries} note="validasi masuk" tone="safe" />
          <Stat icon={Clock3} label="Izin selesai" value={report.summary.completed} note="sudah kembali ke RTB" tone="ink" />
        </section>

        <article className="security-card mt-5 p-6 text-ink">
          <p className="security-kicker">RINGKASAN OPERASIONAL</p>
          <h2 className="mt-2 text-2xl font-medium tracking-tight">{periodMeta.label}</h2>
          <div className="mt-5 grid border-t border-line sm:grid-cols-4">
            <span className="flex items-baseline gap-2.5 border-b border-line py-2.5">
              <LogOut size={16} className="text-signal" /><b className="font-mono text-2xl text-signal">{report.summary.exits}</b>
              <small className="text-muted">keluar</small>
            </span>
            <span className="flex items-baseline gap-2.5 border-b border-line py-2.5">
              <LogIn size={16} className="text-safe" /><b className="font-mono text-2xl text-signal">{report.summary.entries}</b>
              <small className="text-muted">masuk</small>
            </span>
            <span className="flex items-baseline gap-2.5 border-b border-line py-2.5">
              <CheckCircle2 size={16} className="text-safe" /><b className="font-mono text-2xl text-signal">{report.summary.completed}</b>
              <small className="text-muted">selesai</small>
            </span>
            <span className="flex items-baseline gap-2.5 border-b border-line py-2.5">
              <AlertTriangle size={16} className="text-danger" /><b className="font-mono text-2xl text-signal">{report.summary.overdue}</b>
              <small className="text-muted">terlambat</small>
            </span>
          </div>
          <a href={`/api/reports/daily.csv?period=${period}`} className="mt-5 inline-flex items-center gap-1.5 border-b border-signal/50 pb-0.5 text-xs text-signal hover:border-signal">
            Unduh CSV {periodMeta.label.toLowerCase()} <ArrowUpRight size={15} strokeWidth={1.8} />
          </a>
        </article>
      </div>
    </AppShell>
  );
}

function Stat({ icon: Icon, label, value, note, tone }: { icon: LucideIcon; label: string; value: number; note: string; tone: keyof typeof statTone }) {
  return (
    <article className="security-stat-card">
      <span className={`grid h-9 w-9 shrink-0 place-items-center self-start transition-transform duration-200 ${statTone[tone]}`}>
        <Icon size={19} />
      </span>
      <div className="min-w-0">
        <small className="text-[10px] text-muted">{label}</small>
        <b className="block text-2xl leading-tight">{value}</b>
        <em className="text-[10px] text-muted not-italic">{note}</em>
      </div>
    </article>
  );
}
