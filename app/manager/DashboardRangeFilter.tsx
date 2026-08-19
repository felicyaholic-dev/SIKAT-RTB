"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { btn } from "@/lib/ui";

export function DashboardRangeFilter({ paramFrom, paramTo, from, to, ariaLabel }: { paramFrom: string; paramTo: string; from: string; to: string; ariaLabel: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [draftFrom, setDraftFrom] = useState(from);
  const [draftTo, setDraftTo] = useState(to);
  const today = new Date().toISOString().slice(0, 10);
  const isCustom = searchParams.has(paramFrom) || searchParams.has(paramTo);

  function apply() {
    const params = new URLSearchParams(searchParams.toString());
    params.set(paramFrom, draftFrom);
    params.set(paramTo, draftTo);
    router.push(`/manager?${params.toString()}`);
  }

  function reset() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(paramFrom);
    params.delete(paramTo);
    setDraftFrom(from);
    setDraftTo(to);
    router.push(params.toString() ? `/manager?${params.toString()}` : "/manager");
  }

  return (
    <form
      aria-label={ariaLabel}
      onSubmit={(e) => { e.preventDefault(); apply(); }}
      className="flex flex-wrap items-end gap-2"
    >
      <label className="gap-1 text-[10px]">
        Dari
        <input type="date" value={draftFrom} max={draftTo} onChange={(e) => setDraftFrom(e.target.value)} className="min-h-0 px-2.5 py-1.5 text-[11px]" />
      </label>
      <label className="gap-1 text-[10px]">
        Ke
        <input type="date" value={draftTo} min={draftFrom} max={today} onChange={(e) => setDraftTo(e.target.value)} className="min-h-0 px-2.5 py-1.5 text-[11px]" />
      </label>
      <button type="submit" className={`${btn.base} ${btn.outline} min-h-0 px-3 py-1.5 text-[11px]`}>Terapkan</button>
      {isCustom && (
        <button type="button" onClick={reset} aria-label="Reset ke rentang default" className={`${btn.base} min-h-0 px-2.5 py-1.5 text-[11px] text-muted hover:text-signal`}>
          <RotateCcw size={13} /> Reset
        </button>
      )}
    </form>
  );
}
