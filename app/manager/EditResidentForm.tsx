"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { deleteResidentAction, updateResidentAction, type FormState } from "@/app/actions";
import { FormModal } from "@/components/FormModal";
import { btn, formMessage, RESIDENT_CLASSES } from "@/lib/ui";

const initialState: FormState = {};
type Resident = { id: number; bca_id: string; full_name: string; room_number: string; class_name: string; gender: string; resident_status: string; phone_number: string | null };

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
        <FormModal eyebrow="EDIT MASTER PENGHUNI" title={resident.full_name} onClose={() => setOpen(false)} description={<>
              ID BCA <code className="rounded bg-mist px-1.5 py-0.5 font-mono text-[11px] text-ink">{resident.bca_id}</code> tidak dapat diubah agar identitas tetap
              konsisten.
            </>}>
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
                  <select name="className" defaultValue={resident.class_name} required>
                    {!(RESIDENT_CLASSES as readonly string[]).includes(resident.class_name) && (
                      <option value={resident.class_name}>{resident.class_name} (lama)</option>
                    )}
                    {RESIDENT_CLASSES.map((className) => (
                      <option key={className} value={className}>{className}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label>
                  Jenis kelamin
                  <select name="gender" defaultValue={["LAKI_LAKI", "PEREMPUAN"].includes(resident.gender) ? resident.gender : ""} required>
                    <option value="" disabled>Pilih jenis kelamin</option>
                    <option value="LAKI_LAKI">Laki-laki</option>
                    <option value="PEREMPUAN">Perempuan</option>
                  </select>
                </label>
                <label>
                  Nomor WA <span className="font-normal text-muted">(opsional)</span>
                  <input name="phoneNumber" inputMode="numeric" defaultValue={resident.phone_number ?? ""} placeholder="08xxxxxxxxxx" />
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
        </FormModal>
      )}
    </>
  );
}

export function DeleteResidentButton({ resident }: { resident: Resident }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(deleteResidentAction, initialState);

  useEffect(() => {
    if (state.success) {
      setOpen(false);
      router.refresh();
    }
  }, [router, state.success]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Hapus ${resident.full_name}`}
        className="grid h-8 w-8 place-items-center bg-danger-soft text-danger transition-colors hover:bg-danger hover:text-white"
      >
        <Trash2 size={15} />
      </button>
      {open && (
        <FormModal
          eyebrow="HAPUS MASTER PENGHUNI"
          title="Hapus data penghuni ini?"
          description={<>Data <b className="text-ink">{resident.full_name}</b> (ID BCA <code className="rounded bg-mist px-1.5 py-0.5 font-mono text-[11px] text-ink">{resident.bca_id}</code>) beserta akun dan riwayat izinnya akan dihapus permanen. Gunakan hanya jika penghuni ini sudah tidak lagi berada di RTB — tindakan ini tidak dapat dibatalkan.</>}
          onClose={() => setOpen(false)}
        >
          <form action={action} className="grid gap-3">
            <input type="hidden" name="id" value={resident.id} />
            {state.error && <p className={formMessage("error")}>{state.error}</p>}
            <div className="grid gap-2.5 sm:grid-cols-2">
              <button type="button" onClick={() => setOpen(false)} className={`${btn.base} w-full rounded-xl border border-line bg-white text-ink hover:bg-mist`} disabled={pending}>
                Batal
              </button>
              <button className={`${btn.base} w-full rounded-xl border border-danger/30 bg-danger-soft text-danger hover:bg-danger hover:text-white`} disabled={pending}>
                <Trash2 size={15} /> {pending ? "Menghapus…" : "Ya, hapus"}
              </button>
            </div>
          </form>
        </FormModal>
      )}
    </>
  );
}
