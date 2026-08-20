"use client";

import { useActionState } from "react";
import { ArrowRight } from "lucide-react";
import { changePasswordAction, type FormState } from "@/app/actions";
import { PasswordField } from "@/components/PasswordField";
import { btn, formMessage } from "@/lib/ui";

const initialState: FormState = {};

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, initialState);
  return <form action={action} className="grid gap-4">
    <label>Password awal<PasswordField name="currentPassword" autoComplete="current-password" required /></label>
    <label>Password baru<PasswordField name="password" autoComplete="new-password" minLength={8} placeholder="Minimal 8 karakter" required /></label>
    <label>Konfirmasi password baru<PasswordField name="confirmPassword" autoComplete="new-password" required /></label>
    {state.error && <p className={formMessage("error")}>{state.error}</p>}
    <button className={`${btn.base} ${btn.primary} mt-1 w-full`} disabled={pending}>{pending ? "Menyimpan…" : <>Simpan password baru <ArrowRight size={16} /></>}</button>
  </form>;
}
