"use client";

import { useActionState } from "react";
import { ArrowRight, Mail } from "lucide-react";
import { requestManagerPasswordResetAction, type FormState } from "@/app/actions";
import { btn, formMessage } from "@/lib/ui";

const initialState: FormState = {};

export function ManagerResetRequestForm() {
  const [state, action, pending] = useActionState(requestManagerPasswordResetAction, initialState);
  if (state.success) {
    return (
      <div className="grid gap-3 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-safe-soft text-safe"><Mail size={24} /></span>
        <p className={formMessage("success")}>{state.success}</p>
      </div>
    );
  }
  return (
    <form action={action} className="grid gap-4">
      <label>
        ID BCA Pengelola · 6 angka
        <input name="bcaId" inputMode="numeric" pattern="[0-9]{6}" placeholder="100101" required />
      </label>
      {state.error && <p className={formMessage("error")}>{state.error}</p>}
      <button className={`${btn.base} ${btn.primary} mt-1 w-full`} disabled={pending}>
        {pending ? "Mengirim…" : <>Kirim tautan reset <ArrowRight size={16} /></>}
      </button>
    </form>
  );
}
