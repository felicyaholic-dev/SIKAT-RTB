"use client";

import { useActionState } from "react";
import { Check, Clock3, MapPin, UserRound } from "lucide-react";
import { validatePermitAction, type FormState } from "@/app/actions";
import { btn, formMessage, initials, pill, permitTone } from "@/lib/ui";

const initialState: FormState = {};
type Permit = { id: number; permit_code: string; full_name: string; room_number: string; class_name: string; destination: string; planned_departure_at: string; planned_return_at: string; status: string };

export function ValidatePermit({ permit }: { permit: Permit }) {
  const [state, action, pending] = useActionState(validatePermitAction, initialState);
  const incoming = ["SEDANG_DI_LUAR", "TERLAMBAT"].includes(permit.status);
  return (
    <section className="min-h-[366px] border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line bg-safe-soft px-5 py-3 font-mono text-[10px] text-safe">
        <span className="flex items-center gap-1.5">
          <Check size={16} strokeWidth={1.8} /> IZIN DITEMUKAN
        </span>
        <span className={pill(permitTone(permit.status))}>{permit.status.replaceAll("_", " ")}</span>
      </div>
      <div className="flex items-center gap-3.5 px-5 pt-5 pb-4">
        <span className="grid h-14 w-14 shrink-0 place-items-center border border-line bg-signal-soft text-lg font-bold text-navy">{initials(permit.full_name)}</span>
        <div>
          <h2 className="text-xl font-semibold">{permit.full_name}</h2>
          <p className="mt-1 text-xs text-muted">
            {permit.class_name} · Kamar {permit.room_number}
          </p>
          <small className="font-mono text-[10px] text-muted">{permit.permit_code}</small>
        </div>
      </div>
      <dl className="mx-5 grid gap-0">
        <div className="grid gap-1 border-t border-line py-2.5">
          <dt className="flex items-center gap-1.5 text-[11px] text-muted">
            <MapPin size={14} /> Tujuan
          </dt>
          <dd className="text-sm font-semibold">{permit.destination}</dd>
        </div>
        <div className="grid gap-1 border-t border-line py-2.5">
          <dt className="flex items-center gap-1.5 text-[11px] text-muted">
            <Clock3 size={14} /> Rencana kembali
          </dt>
          <dd className="text-sm font-semibold">
            {new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(permit.planned_return_at))}
          </dd>
        </div>
      </dl>
      <form action={action} className="mt-3.5 grid gap-2.5 border-t border-line px-5 pt-4 pb-5">
        <input type="hidden" name="permitId" value={permit.id} />
        <input type="hidden" name="event" value={incoming ? "ENTRY" : "EXIT"} />
        {state.error && <p className={formMessage("error")}>{state.error}</p>}
        {state.success && <p className={formMessage("success")}>{state.success}</p>}
        <button className={`${btn.base} ${incoming ? btn.safe : btn.primary} w-full`} disabled={pending}>
          {pending ? (
            "Mencatat…"
          ) : (
            <>
              <UserRound size={16} /> {incoming ? "Catat masuk" : "Catat keluar"}
            </>
          )}
        </button>
      </form>
    </section>
  );
}
