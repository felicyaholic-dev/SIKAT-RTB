"use client";

import { useActionState, useState } from "react";
import { Pencil, X } from "lucide-react";
import { updateResidentAction, type FormState } from "@/app/actions";
import { btn, formMessage } from "@/lib/ui";

const initialState: FormState = {};
type Resident = { id: number; bca_id: string; full_name: string; room_number: string; class_name: string; resident_status: string };

export function EditResidentForm({ resident }: { resident: Resident }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(updateResidentAction, initialState);
  return (
    <>
      <button
        className="grid h-8 w-8 place-items-center bg-signal-soft text-navy transition-colors hover:bg-signal hover:text-white"
        onClick={() => setOpen(true)}
        aria-label={`Edit ${resident.full_name}`}
      >
        <Pencil size={15} />
      </button>
      {open && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-navy/50 p-5 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="animate-pop relative max-h-[calc(100vh-40px)] w-full max-w-[450px] overflow-auto surface-glass p-6 shadow-xl">
            <button className="absolute top-4 right-4 grid h-8 w-8 place-items-center border border-line bg-mist text-ink" onClick={() => setOpen(false)} aria-label="Tutup">
              <X size={18} />
            </button>
            <p className="font-mono text-[11px] tracking-[0.1em] text-signal">EDIT MASTER PENGHUNI</p>
            <h2 className="mt-2 text-2xl font-semibold">{resident.full_name}</h2>
            <p className="mt-1 mb-5 text-sm text-muted">
              ID BCA <code className="rounded bg-mist px-1.5 py-0.5 font-mono text-[11px] text-ink">{resident.bca_id}</code> tidak dapat diubah agar identitas tetap
              konsisten.
            </p>
            <form action={action} className="grid gap-4">
              <input type="hidden" name="id" value={resident.id} />
              <label>
                Nama lengkap
                <input name="fullName" defaultValue={resident.full_name} required />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label>
                  Kamar
                  <input name="room" defaultValue={resident.room_number} required />
                </label>
                <label>
                  Kelas
                  <input name="className" defaultValue={resident.class_name} required />
                </label>
              </div>
              <label>
                Status penghuni
                <select name="residentStatus" defaultValue={resident.resident_status}>
                  <option value="ACTIVE">Aktif</option>
                  <option value="INACTIVE">Nonaktifkan & cabut akses</option>
                </select>
              </label>
              {state.error && <p className={formMessage("error")}>{state.error}</p>}
              {state.success && <p className={formMessage("success")}>{state.success}</p>}
              <button className={`${btn.base} ${btn.primary} w-full`} disabled={pending}>
                {pending ? "Menyimpan…" : "Simpan perubahan"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
