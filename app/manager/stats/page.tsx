import { AlertTriangle, ArrowUpRight, Building2, Clock3, DoorOpen, type LucideIcon } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { requireRole } from "@/lib/auth";
import { getManagerData } from "@/lib/db";

const statTone = {
  safe: "bg-safe-soft text-safe",
  blue: "bg-signal-soft text-signal",
  danger: "bg-danger-soft text-danger",
  ink: "bg-mist text-navy",
} as const;

export default async function ManagerStatsPage() {
  const session = await requireRole("MANAGER");
  const { stats } = getManagerData();

  return (
    <AppShell role="MANAGER" name={session.name}>
      <div className="mx-auto max-w-6xl px-5 py-9 md:px-10 md:py-10">
        <header className="mb-7 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] tracking-[0.1em] text-signal">STATISTIK RTB</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink md:text-4xl">Angka dan laporan.</h1>
            <p className="mt-1 text-sm text-muted">Ringkasan operasional hari ini dan unduhan laporan.</p>
          </div>
          <span className="rounded-pill bg-mist px-3 py-2 font-mono text-[10px] tracking-wide text-muted">LAPORAN HARI INI</span>
        </header>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat icon={Building2} label="Penghuni aktif" value={stats.residents} note="terdaftar di RTB" tone="safe" />
          <Stat icon={DoorOpen} label="Sedang di luar" value={stats.outside} note="izin masih berjalan" tone="blue" />
          <Stat icon={AlertTriangle} label="Terlambat kembali" value={stats.overdue} note="perlu ditindaklanjuti" tone="danger" />
          <Stat icon={Clock3} label="Izin hari ini" value={stats.today} note="pengajuan tercatat" tone="ink" />
        </section>

        <article className="bg-hero-sky border border-line p-6 text-ink mt-5 max-w-md">
          <p className="font-mono text-[11px] tracking-[0.1em] text-signal">RINGKASAN OPERASIONAL</p>
          <h2 className="mt-2 text-2xl font-medium">Catatan hari ini</h2>
          <div className="mt-5 border-t border-line">
            <span className="flex items-baseline gap-2.5 border-b border-line py-2.5">
              <b className="font-mono text-2xl text-signal">{stats.today}</b>
              <small className="text-muted">izin dibuat</small>
            </span>
            <span className="flex items-baseline gap-2.5 border-b border-line py-2.5">
              <b className="font-mono text-2xl text-signal">{stats.outside}</b>
              <small className="text-muted">masih di luar</small>
            </span>
            <span className="flex items-baseline gap-2.5 py-2.5">
              <b className="font-mono text-2xl text-signal">{stats.overdue}</b>
              <small className="text-muted">perlu follow-up</small>
            </span>
          </div>
          <a href="/api/reports/daily.csv" className="mt-5 inline-flex items-center gap-1.5 border-b border-signal/50 pb-0.5 text-xs text-signal hover:border-signal">
            Unduh CSV hari ini <ArrowUpRight size={15} strokeWidth={1.8} />
          </a>
        </article>
      </div>
    </AppShell>
  );
}

function Stat({ icon: Icon, label, value, note, tone }: { icon: LucideIcon; label: string; value: number; note: string; tone: keyof typeof statTone }) {
  return (
    <article className="flex gap-3 border border-line bg-surface p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
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
