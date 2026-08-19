"use client";

import { useActionState, useState } from "react";
import { FileSpreadsheet } from "lucide-react";
import { importResidentsAction, type FormState } from "@/app/actions";
import { FormModal } from "@/components/FormModal";
import { btn, formMessage } from "@/lib/ui";

const initialState: FormState = {};

export function ImportResidentsForm() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(importResidentsAction, initialState);

  return (
    <>
      <button type="button" className={`${btn.base} ${btn.outline} shrink-0`} onClick={() => setOpen(true)}>
        <FileSpreadsheet size={16} /> Impor Excel
      </button>
      {open && (
        <FormModal
          eyebrow="MASTER PENGHUNI"
          title="Impor penghuni dari Excel"
          description={
            <>
              File <b>.xlsx</b> dengan baris pertama berisi judul kolom: <code className="rounded bg-mist px-1.5 py-0.5 font-mono text-[11px] text-ink">ID BCA</code>,{" "}
              <code className="rounded bg-mist px-1.5 py-0.5 font-mono text-[11px] text-ink">Nama Lengkap</code>,{" "}
              <code className="rounded bg-mist px-1.5 py-0.5 font-mono text-[11px] text-ink">Kamar</code> (format WING-NOMOR, contoh A1-101 — wing menentukan lantai & jenis kelamin),{" "}
              <code className="rounded bg-mist px-1.5 py-0.5 font-mono text-[11px] text-ink">Kelas</code>,{" "}
              <code className="rounded bg-mist px-1.5 py-0.5 font-mono text-[11px] text-ink">Jenis Kelamin</code> (isi L atau P),{" "}
              <code className="rounded bg-mist px-1.5 py-0.5 font-mono text-[11px] text-ink">Password Awal</code> (min. 8 karakter),{" "}
              <code className="rounded bg-mist px-1.5 py-0.5 font-mono text-[11px] text-ink">Nomor WA</code> (opsional), dan{" "}
              <code className="rounded bg-mist px-1.5 py-0.5 font-mono text-[11px] text-ink">Email</code> (opsional). Baris dengan data
              tidak valid akan dilewati dan dilaporkan, baris lain tetap tersimpan.
            </>
          }
          onClose={() => setOpen(false)}
        >
          <form action={action} className="grid gap-4">
            <label>
              File Excel (.xlsx)
              <input name="file" type="file" accept=".xlsx" required />
            </label>
            {state.error && <p className={formMessage("error")}>{state.error}</p>}
            {state.success && <p className={formMessage("success")}>{state.success}</p>}
            {state.detail && state.detail.length > 0 && (
              <div className="max-h-40 overflow-y-auto rounded-xl border border-line bg-mist/60 p-3 text-[11px] leading-relaxed text-muted">
                {state.detail.map((line, index) => (
                  <p key={index}>{line}</p>
                ))}
              </div>
            )}
            <button className={`${btn.base} ${btn.primary} w-full`} disabled={pending}>
              {pending ? "Mengimpor…" : "Impor data"}
            </button>
          </form>
        </FormModal>
      )}
    </>
  );
}
