"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { confirmManagerPasswordResetAction, type FormState } from "@/app/actions";
import { PasswordField } from "@/components/PasswordField";
import { btn, formMessage } from "@/lib/ui";

const initialState: FormState = {};

export function ManagerResetConfirmForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(confirmManagerPasswordResetAction, initialState);
  if (state.success) {
    return (
      <div className="grid gap-3 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-safe-soft text-safe"><CheckCircle2 size={24} /></span>
        <p className={formMessage("success")}>{state.success}</p>
        <Link href="/login" className={`${btn.base} ${btn.primary} mt-2 w-full`}>Masuk sekarang</Link>
      </div>
    );
  }
  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="token" value={token} />
      <label>
        Password baru
        <PasswordField name="password" minLength={8} placeholder="Minimal 8 karakter" required />
      </label>
      <label>
        Konfirmasi password baru
        <PasswordField name="confirmPassword" minLength={8} required />
      </label>
      {state.error && <p className={formMessage("error")}>{state.error}</p>}
      <button className={`${btn.base} ${btn.primary} mt-1 w-full`} disabled={pending}>
        {pending ? "Menyimpan…" : <>Atur password baru <ArrowRight size={16} /></>}
      </button>
    </form>
  );
}
