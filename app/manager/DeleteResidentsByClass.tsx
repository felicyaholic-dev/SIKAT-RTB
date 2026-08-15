"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteResidentsByClassAction, type FormState } from "@/app/actions";
import { FormModal } from "@/components/FormModal";
import { btn, formMessage, RESIDENT_CLASSES } from "@/lib/ui";

const initialState: FormState = {};

export function DeleteResidentsByClass() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [className, setClassName] = useState("");
  const [state, action, pending] = useActionState(deleteResidentsByClassAction, initialState);

  useEffect(() => {
    if (state.success) {
      setOpen(false);
      setClassName("");
      router.refresh();
    }
  }, [router, state.success]);

  return (
    <>
      <button type="button" className={`${btn.base} border border-danger/30 bg-danger-soft text-danger hover:bg-danger hover:text-white shrink-0`} onClick={() => setOpen(true)}>
        <Trash2 size={16} /> Hapus per kelas
      </button>
      {open && (
        <FormModal
          eyebrow="MASTER PENGHUNI"
          title="Hapus seluruh penghuni satu kelas?"
          description="Gunakan saat angkatan sebuah kelas sudah tidak lagi berada di RTB. Seluruh data penghuni, akun, dan riwayat izin kelas yang dipilih akan dihapus permanen — tindakan ini tidak dapat dibatalkan."
          onClose={() => setOpen(false)}
        >
          <form action={action} className="grid gap-4">
            <label>
              Kelas
              <select name="className" value={className} onChange={(event) => setClassName(event.target.value)} required>
                <option value="" disabled>Pilih kelas</option>
                {RESIDENT_CLASSES.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>
            {state.error && <p className={formMessage("error")}>{state.error}</p>}
            <div className="grid gap-2.5 sm:grid-cols-2">
              <button type="button" onClick={() => setOpen(false)} className={`${btn.base} w-full rounded-xl border border-line bg-white text-ink hover:bg-mist`} disabled={pending}>
                Batal
              </button>
              <button className={`${btn.base} w-full rounded-xl border border-danger/30 bg-danger-soft text-danger hover:bg-danger hover:text-white`} disabled={pending || !className}>
                <Trash2 size={15} /> {pending ? "Menghapus…" : "Ya, hapus sekelas"}
              </button>
            </div>
          </form>
        </FormModal>
      )}
    </>
  );
}
