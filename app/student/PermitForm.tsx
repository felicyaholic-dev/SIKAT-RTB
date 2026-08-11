"use client";

import { useActionState } from "react";
import { ArrowRight } from "lucide-react";
import { createPermitAction, type FormState } from "@/app/actions";
import { btn, formMessage } from "@/lib/ui";

const initialState: FormState = {};

export function PermitForm({ disabled }: { disabled: boolean }) {
  const [state, action, pending] = useActionState(createPermitAction, initialState);
  return (
    <form action={action} className="grid gap-4">
      <label>
        Tujuan
        <input name="destination" placeholder="Contoh: Kota Kasablanka" disabled={disabled} required />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label>
          Rencana keluar
          <input name="departure" type="datetime-local" disabled={disabled} required />
        </label>
        <label>
          Rencana kembali
          <input name="returnAt" type="datetime-local" disabled={disabled} required />
        </label>
      </div>
      {disabled ? (
        <p className="rounded-panel bg-mist px-4 py-3 text-[13px] text-muted">Selesaikan izin aktif sebelum membuat pengajuan baru.</p>
      ) : (
        <p className="text-[11px] leading-relaxed text-muted">QR dibuat setelah izin dikirim dan hanya digunakan di pos RTB.</p>
      )}
      {state.error && <p className={formMessage("error")}>{state.error}</p>}
      {state.success && <p className={formMessage("success")}>{state.success}</p>}
      <button className={`${btn.base} ${btn.primary} w-fit`} disabled={disabled || pending}>
        {pending ? "Membuat izin…" : <>Buat izin & QR <ArrowRight size={16} /></>}
      </button>
    </form>
  );
}
