import { Building2, DoorOpen, FileCheck2, LogOut } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { LiveRefresh } from "@/components/LiveRefresh";
import { DashboardRangeFilter } from "@/app/manager/DashboardRangeFilter";
import { requireRole } from "@/lib/auth";
import { getManagerData } from "@/lib/db";
import { formatJakartaInput, initials, pill } from "@/lib/ui";

function time(value: string) { return formatJakartaInput(value, { hour: "2-digit", minute: "2-digit" }); }

function formatRangeLabel(from: string, to: string) {
  const fmt = (d: string) => new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" }).format(new Date(`${d}T00:00:00Z`));
  return from === to ? fmt(from) : `${fmt(from)} – ${fmt(to)}`;
}

export default async function ManagerPage({ searchParams }: { searchParams: Promise<{ actFrom?: string; actTo?: string; peakFrom?: string; peakTo?: string; wingFrom?: string; wingTo?: string }> }) {
  const session = await requireRole("MANAGER");
  const { actFrom, actTo, peakFrom, peakTo, wingFrom, wingTo } = await searchParams;
  const { stats, recentActivity, weeklyActivity, peakHours, wingActivity, range } = getManagerData({ activityFrom: actFrom, activityTo: actTo, peakFrom, peakTo, wingFrom, wingTo });
  const inside = Math.max(0, stats.residents - stats.outside);
  const presenceTotal = inside + stats.outside;
  const totalActivity = Math.max(1, ...weeklyActivity.flatMap((day) => [day.exits, day.entries]));
  const insideAngle = presenceTotal === 0 ? 360 : Math.round((inside / presenceTotal) * 360);
  const totalPeak = Math.max(1, ...peakHours.flatMap((h) => [h.exits, h.entries]));
  const busiestHour = peakHours.reduce((a, b) => (a.exits + a.entries >= b.exits + b.entries ? a : b));
  const maxWingCount = Math.max(1, ...wingActivity.map((w) => w.count));
  return <AppShell role="MANAGER" name={session.name}>
    <div className="security-page mx-auto max-w-[1280px] px-5 py-9 md:px-10 md:py-11">
      <header className="mb-7 flex flex-wrap items-start justify-between gap-4"><div><p className="security-kicker">PENGELOLA</p><h1 className="mt-2 text-[clamp(2rem,4vw,3.15rem)] font-medium tracking-[-0.06em] text-ink">Dashboard</h1><p className="mt-2 text-sm text-muted">Ringkasan kondisi RTB diperbarui berdasarkan aktivitas keluar-masuk.</p></div><LiveRefresh /></header>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric icon={Building2} label="Di dalam RTB" value={inside} note="Mahasiswa saat ini" tone="blue" /><Metric icon={DoorOpen} label="Di luar RTB" value={stats.outside} note="Mahasiswa saat ini" tone="amber" /><Metric icon={LogOut} label="Keluar hari ini" value={stats.exitedToday} note="Mahasiswa saat ini" tone="amber" /><Metric icon={FileCheck2} label="Aktivitas hari ini" value={stats.today} note="Form keluar dibuat" tone="blue" /></section>
      <section className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_.9fr]">
        <article className="security-card min-h-[285px] p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="security-kicker">AKTIVITAS KELUAR-MASUK</p>
              <h2 className="mt-2 text-lg font-medium tracking-tight text-ink">{formatRangeLabel(range.activityFrom, range.activityTo)}</h2>
            </div>
            <DashboardRangeFilter paramFrom="actFrom" paramTo="actTo" from={range.activityFrom} to={range.activityTo} ariaLabel="Rentang tanggal aktivitas keluar-masuk" />
          </div>
          <div className="mt-8 overflow-x-auto">
            <div className="manager-chart flex h-[125px] items-end justify-between gap-2" style={{ minWidth: Math.max(500, weeklyActivity.length * 34) }}>
              {weeklyActivity.map((day) => <span key={day.day} className="group grid flex-1 gap-2 text-center"><span className="flex h-full items-end justify-center gap-1"><i className="block w-2 rounded-t-md bg-amber transition-all group-hover:bg-[#a96000]" style={{ height: `${(day.exits / totalActivity) * 100}%` }} /><i className="block w-2 rounded-t-md bg-signal/85 transition-all group-hover:bg-signal" style={{ height: `${(day.entries / totalActivity) * 100}%` }} /></span><small>{day.label}</small></span>)}
            </div>
          </div>
          <p className="mt-3 flex gap-5 text-[10px] text-muted"><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-amber" />Keluar</span><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-signal" />Masuk</span></p>
        </article>
        <article className="security-card p-5 sm:p-6"><p className="security-kicker">KEBERADAAN SAAT INI</p><h2 className="mt-2 text-lg font-medium tracking-tight text-ink">Di dalam & di luar</h2><div className="manager-donut mt-8 grid place-items-center" style={{ background: `conic-gradient(var(--color-signal) 0deg ${insideAngle}deg, var(--color-amber) ${insideAngle}deg 360deg)` }}><span><b>{stats.residents}</b><small>Mahasiswa</small></span></div><dl className="mt-7 grid gap-2 text-[11px]"><div className="flex justify-between"><dt><i className="mr-2 inline-block h-2 w-2 rounded-full bg-signal" />Di dalam RTB</dt><dd className="font-bold">{inside}</dd></div><div className="flex justify-between"><dt><i className="mr-2 inline-block h-2 w-2 rounded-full bg-amber" />Di luar RTB</dt><dd className="font-bold">{stats.outside}</dd></div></dl></article>
      </section>
      <section className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_.9fr]">
        <article className="security-card p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="security-kicker">JAM SIBUK KELUAR-MASUK</p>
              <h2 className="mt-2 text-lg font-medium tracking-tight text-ink">{formatRangeLabel(range.peakFrom, range.peakTo)} · per jam</h2>
            </div>
            <DashboardRangeFilter paramFrom="peakFrom" paramTo="peakTo" from={range.peakFrom} to={range.peakTo} ariaLabel="Rentang tanggal jam sibuk" />
          </div>
          <p className="mt-3 text-[11px] text-muted">Jam tersibuk: <b className="text-ink">{String(busiestHour.hour).padStart(2, "0")}.00–{String(busiestHour.hour).padStart(2, "0")}.59</b> ({busiestHour.exits + busiestHour.entries} aktivitas)</p>
          <div className="mt-6 overflow-x-auto">
            <div className="manager-chart flex h-[110px] min-w-[620px] items-end justify-between gap-1">
              {peakHours.map((h) => <span key={h.hour} className="group grid flex-1 gap-1.5 text-center"><span className="flex h-full items-end justify-center gap-0.5"><i className="block w-1.5 rounded-t-md bg-amber transition-all group-hover:bg-[#a96000]" style={{ height: `${(h.exits / totalPeak) * 100}%` }} /><i className="block w-1.5 rounded-t-md bg-signal/85 transition-all group-hover:bg-signal" style={{ height: `${(h.entries / totalPeak) * 100}%` }} /></span><small className="text-[9px]">{h.hour % 3 === 0 ? String(h.hour).padStart(2, "0") : ""}</small></span>)}
            </div>
          </div>
          <p className="mt-3 flex gap-5 text-[10px] text-muted"><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-amber" />Keluar</span><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-signal" />Masuk</span></p>
        </article>
        <article className="security-card p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="security-kicker">REKAP WING</p>
              <h2 className="mt-2 text-lg font-medium tracking-tight text-ink">Paling sering mengajukan izin</h2>
            </div>
            <DashboardRangeFilter paramFrom="wingFrom" paramTo="wingTo" from={range.wingFrom} to={range.wingTo} ariaLabel="Rentang tanggal rekap wing" />
          </div>
          <p className="mt-3 text-[11px] text-muted">{formatRangeLabel(range.wingFrom, range.wingTo)}, seluruh {wingActivity.length} wing.</p>
          <div className="mt-5 grid max-h-[420px] gap-3 overflow-y-auto pr-1">
            {wingActivity.map((wing) => <div key={wing.code}><div className="flex items-center justify-between gap-2 text-[11px]"><span className="font-semibold text-ink">{wing.code} <span className="font-normal text-muted">· {wing.floor}</span></span><b className="font-mono text-xs text-ink">{wing.count}</b></div><div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-pill bg-mist"><i className={`block h-full rounded-pill ${wing.gender === "PEREMPUAN" ? "bg-signal" : wing.gender === "LAKI_LAKI" ? "bg-amber" : "bg-muted"}`} style={{ width: `${(wing.count / maxWingCount) * 100}%` }} /></div></div>)}
          </div>
        </article>
      </section>
      <article className="security-card mt-5 p-5 sm:p-6">
        <p className="security-kicker">AKTIVITAS TERBARU</p>
        <h2 className="mt-2 text-lg font-medium tracking-tight">Keluar-masuk 24 jam terakhir</h2>
        <p className="mt-1 text-[11px] text-muted">Hanya aktivitas terbaru — total di luar RTB saat ini tetap di kartu &quot;Di luar RTB&quot; di atas, termasuk yang sudah lebih dari 24 jam.</p>
        {recentActivity.length ? <div className="mt-5">{recentActivity.map((item) => <div key={item.id} className="flex flex-wrap items-center gap-3 border-t border-line py-3.5 first:border-t-0 transition-colors hover:bg-signal-soft/40"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-signal-soft text-[10px] font-bold text-signal">{initials(item.full_name)}</span><span className="min-w-0 flex-1"><b className="block truncate text-[13px]">{item.full_name}</b><small className="text-[11px] text-muted">Kamar {item.room_number} · {item.destination}</small></span><span className="text-right"><small className="block text-[10px] text-muted">Izin disetujui</small><b className="font-mono text-xs">{time(item.planned_departure_at)}</b></span><span className={pill("amber")}>{item.status === "MENUNGGU_MASUK" ? "QR MASUK SIAP" : "DI LUAR"}</span></div>)}</div> : <div className="mt-5 flex min-h-[120px] items-center justify-center gap-3 text-sm text-muted"><DoorOpen size={24} className="text-signal" /><p>Belum ada aktivitas keluar-masuk dalam 24 jam terakhir.</p></div>}
      </article>
    </div>
  </AppShell>;
}

function Metric({ icon: Icon, label, value, note, tone }: { icon: typeof Building2; label: string; value: number; note: "Mahasiswa saat ini" | "Form keluar dibuat"; tone: "blue" | "amber" }) {
  const tones = { blue: "bg-signal-soft text-signal", amber: "bg-amber-soft text-amber" };
  return <article className="security-stat-card"><span className={`grid h-11 w-11 place-items-center rounded-xl ${tones[tone]}`}><Icon size={19} /></span><span><small>{label}</small><b>{value}</b><em>{note}</em></span></article>;
}
