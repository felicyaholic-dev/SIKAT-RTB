"use client";

import { useRouter } from "next/navigation";
import { RESIDENT_CLASSES } from "@/lib/ui";
import { WINGS } from "@/lib/wings";

const periods = [
  { value: "DAY", label: "Hari ini" },
  { value: "WEEK", label: "7 hari" },
  { value: "MONTH", label: "Bulan ini" },
  { value: "YEAR", label: "Tahun ini" },
  { value: "ALL", label: "Semua waktu" },
] as const;

export function HistoryFilters({ wing, kelas, period }: { wing: string; kelas: string; period: string }) {
  const router = useRouter();

  function goTo(next: { wing?: string; kelas?: string; period?: string }) {
    const nextWing = next.wing !== undefined ? next.wing : wing;
    const nextKelas = next.kelas !== undefined ? next.kelas : kelas;
    const nextPeriod = next.period !== undefined ? next.period : period;
    const params = new URLSearchParams();
    if (nextWing) params.set("wing", nextWing);
    if (nextKelas) params.set("kelas", nextKelas);
    if (nextPeriod && nextPeriod !== "ALL") params.set("period", nextPeriod);
    router.push(params.toString() ? `/manager/history?${params.toString()}` : "/manager/history");
  }

  return (
    <div className="mb-5 flex flex-wrap items-center gap-3">
      <nav className="inline-flex rounded-2xl border border-line bg-white p-1.5 shadow-[0_8px_20px_rgb(11_103_146_/_0.05)] dark:bg-surface" aria-label="Jangka waktu">
        {periods.map((item) => (
          <button key={item.value} type="button" onClick={() => goTo({ period: item.value })} className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${period === item.value ? "bg-signal text-white shadow-[0_6px_14px_rgb(7_140_255_/_0.22)]" : "text-muted hover:bg-mist hover:text-ink"}`}>
            {item.label}
          </button>
        ))}
      </nav>
      <select aria-label="Filter wing" value={wing} onChange={(e) => goTo({ wing: e.target.value })} className="rounded-xl border border-line px-3 py-2.5 text-xs font-semibold text-ink">
        <option value="">Semua wing</option>
        {WINGS.map((w) => <option key={w.code} value={w.code}>{w.code} · {w.floor}</option>)}
      </select>
      <select aria-label="Filter kelas" value={kelas} onChange={(e) => goTo({ kelas: e.target.value })} className="rounded-xl border border-line px-3 py-2.5 text-xs font-semibold text-ink">
        <option value="">Semua kelas</option>
        {RESIDENT_CLASSES.map((className) => <option key={className} value={className}>{className}</option>)}
      </select>
    </div>
  );
}
