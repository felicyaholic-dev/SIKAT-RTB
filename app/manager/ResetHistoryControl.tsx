"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eraser, History } from "lucide-react";
import { resetHistoryAction, type FormState } from "@/app/actions";
import { FormModal } from "@/components/FormModal";
import { btn, formMessage, RESIDENT_CLASSES } from "@/lib/ui";

const initialState: FormState = {};

export function ResetHistoryControl() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<"ALL" | "CLASS">("ALL");
  const [className, setClassName] = useState("");
  const [state, action, pending] = useActionState(resetHistoryAction, initialState);

  useEffect(() => {
    if (state.success) {
      setOpen(false);
      setScope("ALL");
      setClassName("");
      router.refresh();
    }
  }, [router, state.success]);

  return (
    <section className="security-card mt-5 p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="security-kicker">RIWAYAT</p>
          <h2 className="mt-2 text-lg font-medium tracking-tight">Reset riwayat keluar-masuk</h2>
          <p className="mt-1 text-sm text-muted">
            Dipakai saat pergantian tahun ajaran agar data lama tidak menumpuk. Unduh laporan lewat halaman
            Laporan (periode &ldquo;Semua waktu&rdquo;) sebagai arsip <b>sebelum</b> mereset.
          </p>
        </div>
        <button type="button" className={`${btn.base} border border-danger/30 bg-danger-soft text-danger hover:bg-danger hover:text-white shrink-0`} onClick={() => setOpen(true)}>
          <Eraser size={16} /> Reset riwayat
        </button>
      </div>
      {open && (
        <FormModal
          eyebrow="RESET RIWAYAT"
          title="Hapus riwayat keluar-masuk?"
          description="Menghapus data izin dan event keluar-masuk (untuk pilihan seluruh sistem, notifikasi broadcast juga ikut terhapus). Akun, Master Penghuni/Satpam, dan audit log tidak disentuh. Tindakan ini tidak dapat dibatalkan."
          onClose={() => setOpen(false)}
        >
          <form action={action} className="grid gap-4">
            <label>
              Cakupan
              <select name="scope" value={scope} onChange={(event) => setScope(event.target.value as "ALL" | "CLASS")}>
                <option value="ALL">Seluruh sistem (semua kelas)</option>
                <option value="CLASS">Kelas tertentu</option>
              </select>
            </label>
            {scope === "CLASS" && (
              <label>
                Kelas
                <select name="className" value={className} onChange={(event) => setClassName(event.target.value)} required>
                  <option value="" disabled>Pilih kelas</option>
                  {RESIDENT_CLASSES.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </label>
            )}
            {state.error && <p className={formMessage("error")}>{state.error}</p>}
            <div className="grid gap-2.5 sm:grid-cols-2">
              <button type="button" onClick={() => setOpen(false)} className={`${btn.base} w-full rounded-xl border border-line bg-white text-ink hover:bg-mist`} disabled={pending}>
                Batal
              </button>
              <button className={`${btn.base} w-full rounded-xl border border-danger/30 bg-danger-soft text-danger hover:bg-danger hover:text-white`} disabled={pending || (scope === "CLASS" && !className)}>
                <History size={15} /> {pending ? "Mereset…" : "Ya, reset"}
              </button>
            </div>
          </form>
        </FormModal>
      )}
    </section>
  );
}
