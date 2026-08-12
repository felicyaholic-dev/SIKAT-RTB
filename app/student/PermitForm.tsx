"use client";

import { useActionState } from "react";
import { ArrowRight } from "lucide-react";
import { createPermitAction, type FormState } from "@/app/actions";
import { btn, formMessage } from "@/lib/ui";

const initialState: FormState = {};

export function PermitForm({ mode }: { mode: "EXIT" | "ENTRY" }) {
  const [state, action, pending] = useActionState(createPermitAction, initialState);
  const now = new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
  const isEntry = mode === "ENTRY";
  return (
    <form action={action} className="grid gap-4">
      {!isEntry && <label>
        Tujuan
        <input name="destination" placeholder="Contoh: Kota Kasablanka" required />
      </label>}
      <div className="grid gap-3">
        <label>
          {isEntry ? "Waktu kembali ke RTB" : "Waktu keluar dari RTB"}
          <input name={isEntry ? "returnAt" : "departure"} type="datetime-local" defaultValue={now} required />
        </label>
      </div>
      <p className="rounded-panel bg-mist px-4 py-3 text-[13px] leading-relaxed text-muted">QR {isEntry ? "masuk" : "keluar"} dibuat setelah form dikirim dan hanya berlaku satu kali di pos RTB.</p>
      {state.error && <p className={formMessage("error")}>{state.error}</p>}
      {state.success && <p className={formMessage("success")}>{state.success}</p>}
      <button className={`${btn.base} ${isEntry ? btn.safe : btn.primary} w-fit`} disabled={pending}>
        {pending ? "Membuat QR…" : <>{isEntry ? "Buat QR masuk" : "Buat izin & QR keluar"} <ArrowRight size={16} /></>}
      </button>
    </form>
  );
}
