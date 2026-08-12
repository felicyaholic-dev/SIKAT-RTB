"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";
import { updateManagerProfileAction, type FormState } from "@/app/actions";
import { btn, formMessage } from "@/lib/ui";

const initialState: FormState = {};

export function ManagerProfileForm({ fullName, bcaId }: { fullName: string; bcaId: string }) {
  const [state, action, pending] = useActionState(updateManagerProfileAction, initialState);
  return (
    <form action={action} className="security-card mt-5 p-6 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="security-kicker">INFORMASI AKUN</p>
          <h2 className="mt-2 text-lg font-medium tracking-tight text-ink">Data akses pribadi</h2>
          <p className="mt-1 text-sm text-muted">Perubahan hanya berlaku untuk akun pengelola yang sedang digunakan.</p>
        </div>
        <span className="rounded-pill bg-mist px-3 py-1.5 font-mono text-[10px] tracking-wide text-muted">AKUN PRIBADI</span>
      </div>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <label>
          Nama lengkap
          <input name="fullName" defaultValue={fullName} minLength={2} required />
        </label>
        <label>
          ID BCA · 6 angka
          <input name="bcaId" inputMode="numeric" pattern="[0-9]{6}" defaultValue={bcaId} required />
        </label>
      </div>
      <p className="mt-4 text-[11px] leading-relaxed text-muted">ID BCA baru akan dipakai pada login berikutnya. Password akun tidak berubah.</p>
      {state.error && <p className={`${formMessage("error")} mt-5`}>{state.error}</p>}
      {state.success && <p className={`${formMessage("success")} mt-5`}>{state.success}</p>}
      <div className="mt-6 flex justify-end border-t border-line pt-5">
        <button className={`${btn.base} ${btn.primary}`} disabled={pending}><Save size={16} /> {pending ? "Menyimpan…" : "Simpan perubahan"}</button>
      </div>
    </form>
  );
}
