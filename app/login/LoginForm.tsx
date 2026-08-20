"use client";

import { useActionState } from "react";
import { ArrowRight } from "lucide-react";
import { loginAction, type FormState } from "@/app/actions";
import { PasswordField } from "@/components/PasswordField";
import { btn, formMessage } from "@/lib/ui";

const initialState: FormState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initialState);
  return (
    <form action={action} className="grid gap-4">
      <label>
        ID BCA
        <input name="bcaId" inputMode="numeric" autoComplete="username" placeholder="Masukkan ID BCA 6 angka" required />
      </label>
      <label>
        Password
        <PasswordField name="password" autoComplete="current-password" placeholder="Masukkan password" required />
      </label>
      {state.error && <p className={formMessage("error")}>{state.error}</p>}
      <button className={`${btn.base} ${btn.primary} mt-1 w-full`} disabled={pending}>
        {pending ? "Memeriksa akun…" : <>Masuk ke sistem <ArrowRight size={16} /></>}
      </button>
    </form>
  );
}
