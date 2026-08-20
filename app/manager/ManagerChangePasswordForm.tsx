"use client";

import { useActionState } from "react";
import { KeyRound } from "lucide-react";
import { changePasswordAction, type FormState } from "@/app/actions";
import { PasswordField } from "@/components/PasswordField";
import { btn, formMessage } from "@/lib/ui";

const initialState: FormState = {};

export function ManagerChangePasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, initialState);
  return (
    <form action={action} className="security-card mt-5 p-6 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="security-kicker">KEAMANAN AKUN</p>
          <h2 className="mt-2 text-lg font-medium tracking-tight text-ink">Ubah password</h2>
          <p className="mt-1 text-sm text-muted">Khusus akun Pengelola — bisa diganti kapan saja, tidak seperti akun mahasiswa/satpam yang hanya bisa sekali saat login pertama.</p>
        </div>
      </div>
      <div className="mt-6 grid gap-5 sm:grid-cols-3">
        <label>
          Password saat ini
          <PasswordField name="currentPassword" autoComplete="current-password" required />
        </label>
        <label>
          Password baru
          <PasswordField name="password" autoComplete="new-password" minLength={8} placeholder="Minimal 8 karakter" required />
        </label>
        <label>
          Konfirmasi password baru
          <PasswordField name="confirmPassword" autoComplete="new-password" required />
        </label>
      </div>
      {state.error && <p className={`${formMessage("error")} mt-5`}>{state.error}</p>}
      {state.success && <p className={`${formMessage("success")} mt-5`}>{state.success}</p>}
      <div className="mt-6 flex justify-end border-t border-line pt-5">
        <button className={`${btn.base} ${btn.primary}`} disabled={pending}><KeyRound size={16} /> {pending ? "Menyimpan…" : "Ganti password"}</button>
      </div>
    </form>
  );
}
