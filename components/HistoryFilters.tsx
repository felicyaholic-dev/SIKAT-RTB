"use client";

import { ChevronDown } from "lucide-react";
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

function parseList(value: string) {
  return value ? value.split(",").filter(Boolean) : [];
}

export function HistoryFilters({ basePath, wing, kelas, period }: { basePath: string; wing: string; kelas: string; period: string }) {
  const router = useRouter();
  const wingList = parseList(wing);
  const kelasList = parseList(kelas);

  function goTo(next: { wing?: string[]; kelas?: string[]; period?: string }) {
    const nextWing = next.wing !== undefined ? next.wing : wingList;
    const nextKelas = next.kelas !== undefined ? next.kelas : kelasList;
    const nextPeriod = next.period !== undefined ? next.period : period;
    const params = new URLSearchParams();
    if (nextWing.length) params.set("wing", nextWing.join(","));
    if (nextKelas.length) params.set("kelas", nextKelas.join(","));
    if (nextPeriod && nextPeriod !== "ALL") params.set("period", nextPeriod);
    router.push(params.toString() ? `${basePath}?${params.toString()}` : basePath);
  }

  function toggleWing(code: string) {
    goTo({ wing: wingList.includes(code) ? wingList.filter((w) => w !== code) : [...wingList, code] });
  }
  function toggleKelas(className: string) {
    goTo({ kelas: kelasList.includes(className) ? kelasList.filter((k) => k !== className) : [...kelasList, className] });
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

      <details className="group relative">
        <summary className="flex list-none items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2.5 text-xs font-semibold text-ink [&::-webkit-details-marker]:hidden dark:bg-surface">
          Wing {wingList.length ? `(${wingList.length})` : "· Semua"} <ChevronDown size={13} className="text-muted transition-transform group-open:rotate-180" />
        </summary>
        <div className="absolute z-20 mt-2 w-64 rounded-xl border border-line bg-white p-3 shadow-lg dark:bg-surface">
          <label className="flex items-center gap-2 border-b border-line pb-2 text-xs font-semibold text-ink">
            <input type="checkbox" checked={wingList.length === 0} onChange={() => goTo({ wing: [] })} /> Semua wing
          </label>
          <div className="mt-2 grid max-h-56 gap-1.5 overflow-y-auto">
            {WINGS.map((w) => (
              <label key={w.code} className="flex items-center gap-2 text-xs text-ink">
                <input type="checkbox" checked={wingList.includes(w.code)} onChange={() => toggleWing(w.code)} /> {w.code} · {w.floor}
              </label>
            ))}
          </div>
        </div>
      </details>

      <details className="group relative">
        <summary className="flex list-none items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2.5 text-xs font-semibold text-ink [&::-webkit-details-marker]:hidden dark:bg-surface">
          Kelas {kelasList.length ? `(${kelasList.length})` : "· Semua"} <ChevronDown size={13} className="text-muted transition-transform group-open:rotate-180" />
        </summary>
        <div className="absolute z-20 mt-2 w-56 rounded-xl border border-line bg-white p-3 shadow-lg dark:bg-surface">
          <label className="flex items-center gap-2 border-b border-line pb-2 text-xs font-semibold text-ink">
            <input type="checkbox" checked={kelasList.length === 0} onChange={() => goTo({ kelas: [] })} /> Semua kelas
          </label>
          <div className="mt-2 grid max-h-56 gap-1.5 overflow-y-auto">
            {RESIDENT_CLASSES.map((className) => (
              <label key={className} className="flex items-center gap-2 text-xs text-ink">
                <input type="checkbox" checked={kelasList.includes(className)} onChange={() => toggleKelas(className)} /> {className}
              </label>
            ))}
          </div>
        </div>
      </details>
    </div>
  );
}
