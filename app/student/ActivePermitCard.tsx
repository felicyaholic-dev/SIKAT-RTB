"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Clock3, MapPin, QrCode, X } from "lucide-react";
import { cancelPendingPermitAction, type FormState } from "@/app/actions";
import { PermitQr } from "@/components/PermitQr";
import { StudentPermitDecisionWatcher } from "@/app/student/StudentPermitDecisionWatcher";
import { btn, formMessage, permitStatusLabel, permitTone, toneDot, toneText } from "@/lib/ui";

const initialState: FormState = {};

type Permit = {
  id: number;
  permit_code: string;
  entry_code: string | null;
  destination: string;
  planned_departure_at: string;
  planned_return_at: string;
  status: string;
};

type Decision = { permit_id: number; event_type: "EXIT" | "ENTRY" | "EXIT_REJECTED"; occurred_at: string } | null;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export function ActivePermitCard({ permit, qr, latestDecision }: { permit: Permit; qr: string; latestDecision: Decision }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(cancelPendingPermitAction, initialState);
  const isEntry = permit.status === "MENUNGGU_MASUK";
  const code = isEntry ? permit.entry_code! : permit.permit_code;

  useEffect(() => {
    if (state.success) router.refresh();
  }, [router, state.success]);

  return (
    <article className="relative min-h-[260px] max-w-xl overflow-hidden border border-line bg-surface p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3 pb-4">
        <span className={`flex items-center gap-2 text-[13px] font-semibold ${toneText(permitTone(permit.status))}`}><i aria-hidden className={`h-1.5 w-1.5 rounded-full not-italic ${toneDot(permitTone(permit.status))}`} />{permitStatusLabel(permit.status)}</span>
        <span className="shrink-0 text-right text-[11px] text-muted">{isEntry ? `Dibuat ${formatDate(permit.planned_return_at)}` : `Dibuat ${formatDate(permit.planned_departure_at)}`}</span>
      </div>

      <div className="border border-line">
        <div className="flex items-center justify-between border-b border-line px-5 py-3"><small className="font-mono text-[10px] tracking-[0.14em] text-muted">{isEntry ? "QR MASUK RTB" : "QR KELUAR RTB"}</small><b className="font-mono text-sm tracking-wide">#{code}</b></div>
        <div className="flex flex-col items-center gap-6 p-6">
          <PermitQr svg={qr} className="h-52 w-52 sm:h-60 sm:w-60" />
          <dl className="grid w-full max-w-xs grid-cols-2 gap-x-4 gap-y-3.5 text-[12px]">
            <div className="col-span-2 text-center"><dt className="flex items-center justify-center gap-1.5 text-muted"><MapPin size={13} strokeWidth={1.6} /> Tujuan</dt><dd className="mt-0.5 font-semibold">{permit.destination}</dd></div>
            <div className="col-span-2 text-center"><dt className="flex items-center justify-center gap-1.5 text-muted"><Clock3 size={13} strokeWidth={1.6} /> {isEntry ? "Kembali" : "Keluar"}</dt><dd className="mt-0.5 font-semibold">{formatDate(isEntry ? permit.planned_return_at : permit.planned_departure_at)}</dd></div>
          </dl>
        </div>
        <div className="stub-edge px-5 py-4" style={{ "--stub-bg": "var(--color-surface)" } as React.CSSProperties}><p className="text-center text-[11px] text-muted">Pindai atau masukkan kode: <b className="font-mono text-ink">{code}</b></p></div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-panel bg-amber-soft px-4 py-3">
        <p className="max-w-sm text-[12px] leading-relaxed text-amber"><QrCode size={14} className="mr-1 inline-block" /> QR masih menunggu keputusan satpam.</p>
        <form action={action}>
          <input type="hidden" name="permitId" value={permit.id} />
          <button className={`${btn.base} border border-danger/25 bg-white px-3 py-2 text-xs text-danger hover:bg-danger hover:text-white`} disabled={pending}><X size={15} /> {pending ? "Membatalkan…" : "Batalkan"}</button>
        </form>
      </div>
      {state.error && <p className={`${formMessage("error")} mt-3`}>{state.error}</p>}
      {state.success && <p className={`${formMessage("success")} mt-3`}>{state.success}</p>}
      <StudentPermitDecisionWatcher permitId={permit.id} initialDecision={latestDecision} />
    </article>
  );
}
