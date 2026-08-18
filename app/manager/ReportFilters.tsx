"use client";

import { useRouter } from "next/navigation";
import { RESIDENT_CLASSES } from "@/lib/ui";

export function ReportFilters({ period, jenis, kelas }: { period: string; jenis: string; kelas: string }) {
  const router = useRouter();

  function goTo(next: { period?: string; jenis?: string; kelas?: string }) {
    const params = new URLSearchParams({ period, jenis, kelas: kelas || "" });
    if (next.period) params.set("period", next.period);
    if (next.jenis) params.set("jenis", next.jenis);
    if (next.kelas !== undefined) params.set("kelas", next.kelas);
    if (!params.get("kelas")) params.delete("kelas");
    router.push(`/manager/stats?${params.toString()}`);
  }

  return (
    <select
      aria-label="Filter kelas"
      value={kelas}
      onChange={(event) => goTo({ kelas: event.target.value })}
      className="rounded-xl border border-line px-3 py-2.5 text-xs font-semibold text-ink"
    >
      <option value="">Semua kelas</option>
      {RESIDENT_CLASSES.map((className) => (
        <option key={className} value={className}>{className}</option>
      ))}
    </select>
  );
}
