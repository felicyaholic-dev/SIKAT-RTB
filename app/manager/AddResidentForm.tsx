"use client";

import { useState, useActionState } from "react";
import { Plus, X } from "lucide-react";
import { addResidentAction, type FormState } from "@/app/actions";
import { btn, formMessage } from "@/lib/ui";

const initialState: FormState = {};

export function AddResidentForm() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(addResidentAction, initialState);
  return (
    <>
      <button className={`${btn.base} ${btn.primary} shrink-0`} onClick={() => setOpen(true)}>
        <Plus size={16} /> Tambah penghuni
      </button>
      {open && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-navy/50 p-5 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="animate-pop relative w-full max-w-[450px] surface-glass p-6 shadow-xl">
            <button className="absolute top-4 right-4 grid h-8 w-8 place-items-center border border-line bg-mist text-ink" onClick={() => setOpen(false)} aria-label="Tutup">
              <X size={18} />
            </button>
            <p className="font-mono text-[11px] tracking-[0.1em] text-signal">MASTER PENGHUNI</p>
            <h2 className="mt-2 text-2xl font-semibold">Tambah data baru</h2>
            <p className="mt-1 mb-5 text-sm text-muted">Data ini menjadi patokan aktivasi akun mahasiswa.</p>
            <form action={action} className="grid gap-4">
              <label>
                ID BCA · 6 angka
                <input name="bcaId" inputMode="numeric" pattern="[0-9]{6}" placeholder="100101" required />
              </label>
              <label>
                Nama lengkap
                <input name="fullName" placeholder="Nama sesuai data RTB" required />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label>
                  Kamar
                  <input name="room" placeholder="A128" required />
                </label>
                <label>
                  Kelas
                  <input name="className" placeholder="BCA Learning 2025" required />
                </label>
              </div>
              <label>
                Password awal
                <input name="password" type="password" minLength={8} placeholder="Minimal 8 karakter" required />
              </label>
              <p className="-mt-2 text-[11px] leading-relaxed text-muted">Mahasiswa menggunakan password ini untuk login pertama, lalu wajib membuat password pribadi.</p>
              {state.error && <p className={formMessage("error")}>{state.error}</p>}
              {state.success && <p className={formMessage("success")}>{state.success}</p>}
              <button className={`${btn.base} ${btn.primary} w-full`} disabled={pending}>
                {pending ? "Menyimpan…" : "Simpan ke master data"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
