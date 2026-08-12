"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, CircleX, House, ShieldCheck } from "lucide-react";

type Decision = {
  permit_id: number;
  event_type: "EXIT" | "ENTRY" | "EXIT_REJECTED";
  occurred_at: string;
};

const DISPLAY_DURATION = 30 * 1000;

function age(decision: Decision) {
  return Date.now() - new Date(`${decision.occurred_at}Z`).getTime();
}

function isCurrent(decision: Decision | null, permitId: number | null) {
  return Boolean(decision && permitId && decision.permit_id === permitId && age(decision) >= 0 && age(decision) < DISPLAY_DURATION);
}

export function StudentPermitDecisionWatcher({ permitId, initialDecision }: { permitId: number | null; initialDecision: Decision | null }) {
  const router = useRouter();
  const [decision, setDecision] = useState<Decision | null>(() => isCurrent(initialDecision, permitId) ? initialDecision : null);

  useEffect(() => {
    if (!permitId || decision) return;
    let active = true;
    const check = async () => {
      try {
        const response = await fetch("/api/student/permit-status", { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json() as { decision: Decision | null };
        if (active && isCurrent(data.decision, permitId)) setDecision(data.decision);
      } catch {
        // A retry on the next interval is sufficient for this small live-status cue.
      }
    };
    void check();
    const interval = window.setInterval(() => { void check(); }, 2500);
    return () => { active = false; window.clearInterval(interval); };
  }, [decision, permitId]);

  useEffect(() => {
    if (!decision) return;
    const remaining = Math.max(0, DISPLAY_DURATION - age(decision));
    const timeout = window.setTimeout(() => router.refresh(), remaining);
    return () => window.clearTimeout(timeout);
  }, [decision, router]);

  if (!decision) return null;
  const rejected = decision.event_type === "EXIT_REJECTED";
  const entered = decision.event_type === "ENTRY";
  const title = rejected ? "Izin kamu dibatalkan" : entered ? "Kamu sudah tercatat masuk" : "Izin kamu disetujui";
  const copy = rejected ? "Kamu tetap tercatat berada di dalam RTB." : entered ? "Selamat datang kembali. Statusmu sekarang di dalam RTB." : "Kamu boleh keluar. Statusmu sekarang di luar RTB.";

  return (
    <div className="absolute inset-0 z-10 grid min-h-full place-items-center overflow-hidden rounded-panel bg-surface px-5 py-8 text-center">
      <span aria-hidden className={`pointer-events-none absolute -right-20 -top-16 h-52 w-52 rounded-full blur-3xl ${rejected ? "bg-danger-soft" : "bg-safe-soft"}`} />
      <div className="relative grid max-w-sm justify-items-center">
        <span className={`animate-stamp grid h-24 w-24 place-items-center rounded-[30px] shadow-[inset_0_0_0_4px_white] ${rejected ? "bg-danger-soft text-danger" : "bg-safe-soft text-safe"}`}>
          {rejected ? <CircleX size={47} strokeWidth={1.7} /> : entered ? <House size={45} strokeWidth={1.7} /> : <CheckCircle2 size={47} strokeWidth={1.7} />}
        </span>
        <p className={`mt-6 font-mono text-[10px] font-bold tracking-[0.14em] ${rejected ? "text-danger" : "text-safe"}`}>{rejected ? "KEPUTUSAN SATPAM" : "IZIN TERKONFIRMASI"}</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">{copy}</p>
        <span className="mt-5 flex items-center gap-1.5 text-[11px] text-muted"><ShieldCheck size={14} className={rejected ? "text-danger" : "text-safe"} /> Tampilan ini akan hilang otomatis dalam 30 detik.</span>
      </div>
    </div>
  );
}
