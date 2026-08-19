import { Building2, DoorOpen, FileCheck2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { LiveRefresh } from "@/components/LiveRefresh";
import { requireRole } from "@/lib/auth";
import { getManagerData } from "@/lib/db";
import { formatJakartaInput, initials, pill } from "@/lib/ui";

function time(value: string) { return formatJakartaInput(value, { hour: "2-digit", minute: "2-digit" }); }

export default async function ManagerPage() {
  const session = await requireRole("MANAGER");
  const { watchlist, stats, weeklyActivity } = getManagerData();
  const inside = Math.max(0, stats.residents - stats.outside);
  const presenceTotal = inside + stats.outside;
  const totalActivity = Math.max(1, ...weeklyActivity.flatMap((day) => [day.exits, day.entries]));
  const insideAngle = presenceTotal === 0 ? 360 : Math.round((inside / presenceTotal) * 360);
  return <AppShell role="MANAGER" name={session.name}>
    <div className="security-page mx-auto max-w-[1280px] px-5 py-9 md:px-10 md:py-11">
      <header className="mb-7 flex flex-wrap items-start justify-between gap-4"><div><p className="security-kicker">PENGELOLA</p><h1 className="mt-2 text-[clamp(2rem,4vw,3.15rem)] font-medium tracking-[-0.06em] text-ink">Dashboard</h1><p className="mt-2 text-sm text-muted">Ringkasan kondisi RTB diperbarui berdasarkan aktivitas keluar-masuk.</p></div><LiveRefresh /></header>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"><Metric icon={Building2} label="Di dalam RTB" value={inside} note="Mahasiswa saat ini" tone="blue" /><Metric icon={DoorOpen} label="Di luar RTB" value={stats.outside} note="Mahasiswa saat ini" tone="amber" /><Metric icon={FileCheck2} label="Aktivitas hari ini" value={stats.today} note="Form keluar dibuat" tone="blue" /></section>
      <section className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_.9fr]">
        <article className="security-card min-h-[285px] p-5 sm:p-6"><p className="security-kicker">AKTIVITAS KELUAR-MASUK</p><h2 className="mt-2 text-lg font-medium tracking-tight text-ink">7 hari terakhir</h2><div className="manager-chart mt-10 flex h-[125px] items-end justify-between gap-2">{weeklyActivity.map((day) => <span key={day.label} className="group grid flex-1 gap-2 text-center"><span className="flex h-full items-end justify-center gap-1"><i className="block w-2 rounded-t-md bg-amber transition-all group-hover:bg-[#a96000]" style={{ height: `${(day.exits / totalActivity) * 100}%` }} /><i className="block w-2 rounded-t-md bg-signal/85 transition-all group-hover:bg-signal" style={{ height: `${(day.entries / totalActivity) * 100}%` }} /></span><small>{day.label}</small></span>)}</div><p className="mt-3 flex gap-5 text-[10px] text-muted"><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-amber" />Keluar</span><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-signal" />Masuk</span></p></article>
        <article className="security-card p-5 sm:p-6"><p className="security-kicker">KEBERADAAN SAAT INI</p><h2 className="mt-2 text-lg font-medium tracking-tight text-ink">Di dalam & di luar</h2><div className="manager-donut mt-8 grid place-items-center" style={{ background: `conic-gradient(var(--color-signal) 0deg ${insideAngle}deg, var(--color-amber) ${insideAngle}deg 360deg)` }}><span><b>{stats.residents}</b><small>Mahasiswa</small></span></div><dl className="mt-7 grid gap-2 text-[11px]"><div className="flex justify-between"><dt><i className="mr-2 inline-block h-2 w-2 rounded-full bg-signal" />Di dalam RTB</dt><dd className="font-bold">{inside}</dd></div><div className="flex justify-between"><dt><i className="mr-2 inline-block h-2 w-2 rounded-full bg-amber" />Di luar RTB</dt><dd className="font-bold">{stats.outside}</dd></div></dl></article>
      </section>
      <article className="security-card mt-5 p-5 sm:p-6"><p className="security-kicker">AKTIVITAS TERBARU</p><h2 className="mt-2 text-lg font-medium tracking-tight">Mahasiswa di luar RTB</h2>{watchlist.length ? <div className="mt-5">{watchlist.map((item) => <div key={item.id} className="flex flex-wrap items-center gap-3 border-t border-line py-3.5 first:border-t-0 transition-colors hover:bg-signal-soft/40"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-signal-soft text-[10px] font-bold text-signal">{initials(item.full_name)}</span><span className="min-w-0 flex-1"><b className="block truncate text-[13px]">{item.full_name}</b><small className="text-[11px] text-muted">Kamar {item.room_number} · {item.destination}</small></span><span className="text-right"><small className="block text-[10px] text-muted">Izin disetujui</small><b className="font-mono text-xs">{time(item.planned_departure_at)}</b></span><span className={pill("amber")}>{item.status === "MENUNGGU_MASUK" ? "QR MASUK SIAP" : "DI LUAR"}</span></div>)}</div> : <div className="mt-5 flex min-h-[120px] items-center justify-center gap-3 text-sm text-muted"><DoorOpen size={24} className="text-signal" /><p>Belum ada mahasiswa yang tercatat di luar RTB.</p></div>}</article>
    </div>
  </AppShell>;
}

function Metric({ icon: Icon, label, value, note, tone }: { icon: typeof Building2; label: string; value: number; note: "Mahasiswa saat ini" | "Form keluar dibuat"; tone: "blue" | "amber" }) {
  const tones = { blue: "bg-signal-soft text-signal", amber: "bg-amber-soft text-amber" };
  return <article className="security-stat-card"><span className={`grid h-11 w-11 place-items-center rounded-xl ${tones[tone]}`}><Icon size={19} /></span><span><small>{label}</small><b>{value}</b><em>{note}</em></span></article>;
}
