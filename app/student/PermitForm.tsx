"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarDays, FilePlus2, IdCard, RotateCcw } from "lucide-react";
import { createPermitAction, type FormState } from "@/app/actions";
import { btn, formMessage } from "@/lib/ui";

const initialState: FormState = {};
type Student = { full_name: string; class_name: string; room_number: string };

function localTime() {
  const date = new Date(Date.now() - new Date().getTimezoneOffset() * 60_000);
  return date.toISOString().slice(11, 16);
}

// Izin hanya berlaku untuk hari ini — server juga menegakkan ini sendiri
// (createPermitAction menghitung ulang tanggalnya, tidak memercayai form),
// jadi field tanggal di sini murni tampilan, bukan input yang bisa diubah.
function todayLabel() {
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(new Date());
}

export function PermitForm({ mode, student }: { mode: "EXIT" | "ENTRY"; student: Student }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(createPermitAction, initialState);
  const time = localTime();
  const isEntry = mode === "ENTRY";

  useEffect(() => {
    if (state.success) router.refresh();
  }, [router, state.success]);

  return (
    <form action={action} className="student-application security-card overflow-hidden">
      <section className="p-5 sm:p-7">
        <div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-signal-soft text-signal"><IdCard size={19} /></span><div><h2 className="text-base font-semibold tracking-tight text-ink">Data mahasiswa</h2><p className="mt-0.5 text-[11px] text-muted">Terisi dari akun yang sedang digunakan</p></div></div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label>Nama lengkap<input value={student.full_name} readOnly className="bg-mist/70 font-medium uppercase text-muted" /></label>
          <label>Kelas<input value={student.class_name} readOnly className="bg-mist/70 font-medium text-muted" /></label>
          <label className="sm:max-w-[calc(50%-0.5rem)]">Nomor kamar<input value={student.room_number} readOnly className="bg-mist/70 font-medium text-muted" /></label>
        </div>
      </section>

      <section className="border-t border-line p-5 sm:p-7">
        <div className="flex items-start gap-3"><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${isEntry ? "bg-safe-soft text-safe" : "bg-signal-soft text-signal"}`}>{isEntry ? <RotateCcw size={19} /> : <FilePlus2 size={19} />}</span><div><h2 className="text-base font-semibold tracking-tight text-ink">{isEntry ? "Konfirmasi kembali" : "Informasi izin"}</h2><p className="mt-0.5 text-[11px] text-muted">{isEntry ? "Isi waktu saat kamu kembali ke RTB" : "Isi sesuai kebutuhan keluar RTB"}</p></div></div>

        {!isEntry && <div className="mt-6 grid gap-4 sm:grid-cols-2"><label>Jenis izin<select name="permitType" defaultValue="IZIN_PRIBADI" required><option value="IZIN_PRIBADI">Izin pribadi</option><option value="IZIN_AKADEMIK">Izin akademik</option><option value="IZIN_KESEHATAN">Izin kesehatan</option><option value="KEPERLUAN_KELUARGA">Keperluan keluarga</option><option value="LAINNYA">Lainnya</option></select></label><label>Tanggal keluar<input value={todayLabel()} readOnly className="bg-mist/70 font-medium text-muted" /></label></div>}

        <div className={`mt-4 grid gap-4 ${isEntry ? "sm:grid-cols-2" : "sm:max-w-[calc(50%-0.5rem)]"}`}>
          {isEntry && <label>Tanggal kembali<input value={todayLabel()} readOnly className="bg-mist/70 font-medium text-muted" /></label>}
          <label>{isEntry ? "Jam kembali" : "Jam keluar"}<input name="time" type="time" defaultValue={time} min={isEntry ? undefined : "05:00"} max={isEntry ? undefined : "22:00"} required /></label>
        </div>
        {!isEntry && <p className="mt-2 text-[11px] text-muted">Pengajuan keluar hanya bisa untuk pukul 05.00–22.00 (jam malam 22.00–05.00 tidak diperbolehkan).</p>}

        {!isEntry && <label className="mt-4">Keterangan<textarea name="destination" rows={5} placeholder="Tuliskan tujuan atau kebutuhan izin secara singkat" required /></label>}
        {isEntry && <p className="mt-5 rounded-panel bg-safe-soft px-4 py-3 text-[12px] leading-relaxed text-safe">Setelah form dikirim, sistem membuat QR masuk baru untuk divalidasi satpam.</p>}
        {state.error && <p className={`${formMessage("error")} mt-5`}>{state.error}</p>}
        {state.success && <p className={`${formMessage("success")} mt-5`}>{state.success}</p>}
      </section>

      <footer className="flex flex-wrap items-center justify-end gap-3 border-t border-line bg-[#fbfdff] px-5 py-4 sm:px-7 dark:bg-surface"><span className="mr-auto flex items-center gap-1.5 text-[11px] text-muted"><CalendarDays size={14} /> QR dibuat setelah pengajuan dikirim</span><button className={`${btn.base} ${isEntry ? btn.safe : btn.primary}`} disabled={pending}>{pending ? "Membuat QR…" : <>{isEntry ? "Buat QR masuk" : "Buat pengajuan"}<ArrowRight size={16} /></>}</button></footer>
    </form>
  );
}
