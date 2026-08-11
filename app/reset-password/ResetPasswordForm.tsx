"use client";

import { useActionState } from "react";
import { ArrowRight } from "lucide-react";
import { resetPasswordAction, type FormState } from "@/app/actions";
import { btn, formMessage } from "@/lib/ui";

const initialState: FormState = {};

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(resetPasswordAction, initialState);
  return (
    <form action={action} className="grid gap-4">
      <label>
        ID BCA · 6 angka
        <input name="bcaId" inputMode="numeric" pattern="[0-9]{6}" placeholder="100101" required />
      </label>
      <label>
        Nama lengkap
        <input name="fullName" placeholder="Sesuai data RTB" required />
      </label>
      <label>
        Nomor kamar
        <input name="room" placeholder="A128" required />
      </label>
      <label>
        Password baru
        <input name="password" type="password" minLength={8} placeholder="Minimal 8 karakter" required />
      </label>
      {state.error && <p className={formMessage("error")}>{state.error}</p>}
      {state.success && <p className={formMessage("success")}>{state.success}</p>}
      <button className={`${btn.base} ${btn.primary} mt-1 w-full`} disabled={pending}>
        {pending ? "Memverifikasi…" : <>Atur ulang password <ArrowRight size={16} /></>}
      </button>
    </form>
  );
}
