import { Building2, Clock3, DoorOpen, FileCheck2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { requireRole } from "@/lib/auth";
import { getManagerData } from "@/lib/db";
import { initials, pill } from "@/lib/ui";

function time(value: string) { return new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" }).format(new Date(value)); }

export default async function ManagerPage() {
  const session = await requireRole("MANAGER");
  const { watchlist, stats } = getManagerData();
  const inside = Math.max(0, stats.residents - stats.outside);
  return <AppShell role="MANAGER" name={session.name}>
    <div className="security-page mx-auto max-w-[1280px] px-5 py-9 md:px-10 md:py-11">
      <header className="mb-7 flex flex-wrap items-start justify-between gap-4"><div><p className="security-kicker">PENGELOLA</p><h1 className="mt-2 text-[clamp(2rem,4vw,3.15rem)] font-medium tracking-[-0.06em] text-ink">Dashboard</h1><p className="mt-2 text-sm text-muted">Ringkasan kondisi RTB diperbarui berdasarkan aktivitas keluar-masuk.</p></div><span className="rounded-pill bg-mist px-3 py-2 font-mono text-[10px] tracking-wide text-muted">HARI INI</span></header>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric icon={Building2} label="Di dalam RTB" value={inside} note="Mahasiswa saat ini" tone="safe" /><Metric icon={DoorOpen} label="Di luar RTB" value={stats.outside} note="Mahasiswa saat ini" tone="blue" /><Metric icon={FileCheck2} label="Perizinan hari ini" value={stats.today} note="Pengajuan dibuat" tone="violet" /><Metric icon={Clock3} label="Perlu perhatian" value={stats.overdue} note="Terlambat kembali" tone="amber" /></section>
      <section className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_.9fr]">
        <article className="security-card min-h-[285px] p-5 sm:p-6"><p className="security-kicker">AKTIVITAS KELUAR-MASUK</p><h2 className="mt-2 text-lg font-medium tracking-tight text-ink">7 hari terakhir</h2><div className="manager-chart mt-10 flex h-[125px] items-end justify-between gap-2">{[34, 48, 37, 67, 44, 56, 39].map((height, index) => <span key={index} className="group grid flex-1 gap-2 text-center"><i className="block rounded-t-md bg-signal/85 transition-all group-hover:bg-signal" style={{ height: `${height}%` }} /><small>{["Sel", "Rab", "Kam", "Jum", "Sab", "Min", "Sen"][index]}</small></span>)}</div><p className="mt-3 flex gap-5 text-[10px] text-muted"><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-signal" />Keluar</span><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-safe" />Masuk</span></p></article>
        <article className="security-card p-5 sm:p-6"><p className="security-kicker">KEBERADAAN SAAT INI</p><h2 className="mt-2 text-lg font-medium tracking-tight text-ink">Di dalam & di luar</h2><div className="manager-donut mt-8 grid place-items-center"><span><b>{stats.residents}</b><small>Mahasiswa</small></span></div><dl className="mt-7 grid gap-2 text-[11px]"><div className="flex justify-between"><dt><i className="mr-2 inline-block h-2 w-2 rounded-full bg-safe" />Di dalam RTB</dt><dd className="font-bold">{inside}</dd></div><div className="flex justify-between"><dt><i className="mr-2 inline-block h-2 w-2 rounded-full bg-signal" />Di luar RTB</dt><dd className="font-bold">{stats.outside}</dd></div></dl></article>
      </section>
      <article className="security-card mt-5 p-5 sm:p-6"><p className="security-kicker">AKTIVITAS TERBARU</p><h2 className="mt-2 text-lg font-medium tracking-tight">Keluar-masuk mahasiswa</h2>{watchlist.length ? <div className="mt-5">{watchlist.map((item) => <div key={item.id} className="flex flex-wrap items-center gap-3 border-t border-line py-3.5 first:border-t-0 transition-colors hover:bg-signal-soft/40"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-signal-soft text-[10px] font-bold text-signal">{initials(item.full_name)}</span><span className="min-w-0 flex-1"><b className="block truncate text-[13px]">{item.full_name}</b><small className="text-[11px] text-muted">Kamar {item.room_number} · {item.destination}</small></span><span className="text-right"><small className="block text-[10px] text-muted">Rencana kembali</small><b className="font-mono text-xs">{time(item.planned_return_at)}</b></span><span className={pill(item.status === "TERLAMBAT" ? "danger" : "safe")}>{item.status === "TERLAMBAT" ? "TERLAMBAT" : "DI LUAR"}</span></div>)}</div> : <div className="mt-5 flex min-h-[120px] items-center justify-center gap-3 text-sm text-muted"><DoorOpen size={24} className="text-signal" /><p>Belum ada aktivitas keluar-masuk yang perlu diperhatikan.</p></div>}</article>
    </div>
  </AppShell>;
}

function Metric({ icon: Icon, label, value, note, tone }: { icon: typeof Building2; label: string; value: number; note: string; tone: "safe" | "blue" | "violet" | "amber" }) {
  const tones = { safe: "bg-safe-soft text-safe", blue: "bg-signal-soft text-signal", violet: "bg-[#f0edff] text-[#7971d7]", amber: "bg-amber-soft text-amber" };
  return <article className="security-stat-card"><span className={`grid h-11 w-11 place-items-center rounded-xl ${tones[tone]}`}><Icon size={19} /></span><span><small>{label}</small><b>{value}</b><em>{note}</em></span></article>;
}
