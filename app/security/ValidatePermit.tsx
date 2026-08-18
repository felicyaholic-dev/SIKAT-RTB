"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, CheckCircle2, CircleX, Clock3, FileText, MapPin, ShieldCheck, UserRound } from "lucide-react";
import { validatePermitAction, type FormState } from "@/app/actions";
import { FormModal } from "@/components/FormModal";
import { btn, formMessage, initials, pill, permitTone } from "@/lib/ui";

const initialState: FormState = {};
type Permit = { id: number; permit_code: string; entry_code: string | null; full_name: string; room_number: string; class_name: string; permit_type: string; destination: string; planned_departure_at: string; planned_return_at: string; status: string };

const permitTypeLabel: Record<string, string> = {
  IZIN_PRIBADI: "Izin pribadi",
  IZIN_AKADEMIK: "Izin akademik",
  IZIN_KESEHATAN: "Izin kesehatan",
  KEPERLUAN_KELUARGA: "Keperluan keluarga",
  LAINNYA: "Lainnya",
};

export function ValidatePermit({ permit }: { permit: Permit }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(validatePermitAction, initialState);
  const [open, setOpen] = useState(true);
  const [decision, setDecision] = useState<"APPROVE" | "REJECT" | null>(null);
  const incoming = permit.status === "MENUNGGU_MASUK";
  const close = () => {
    setOpen(false);
    router.replace("/security");
  };

  if (!open) return null;

  if (state.success) {
    const cancelled = decision === "REJECT";
    const title = cancelled ? "Izin dibatalkan" : incoming ? "Masuk disetujui" : "Izin disetujui";
    return (
      <FormModal eyebrow="KEPUTUSAN TERSIMPAN" title={title} description="Status mahasiswa dan riwayat validasi sudah diperbarui." onClose={close}>
        <div className="grid justify-items-center py-3 text-center">
          <span className={`animate-stamp grid h-20 w-20 place-items-center rounded-[26px] ${cancelled ? "bg-danger-soft text-danger" : "bg-safe-soft text-safe"}`}>
            {cancelled ? <CircleX size={40} strokeWidth={1.8} /> : <CheckCircle2 size={40} strokeWidth={1.8} />}
          </span>
          <h3 className="mt-5 text-xl font-semibold tracking-tight text-ink">{cancelled ? "Mahasiswa tetap di RTB." : incoming ? "Mahasiswa kembali tercatat di RTB." : "Mahasiswa kini tercatat di luar RTB."}</h3>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">{state.success}</p>
          <button type="button" onClick={close} className={`${btn.base} ${cancelled ? "bg-danger text-white hover:bg-[#db3348]" : btn.primary} mt-7 min-w-40`}>
            Selesai
          </button>
        </div>
      </FormModal>
    );
  }

  return (
    <FormModal
      eyebrow={incoming ? "KONFIRMASI MASUK" : "KONFIRMASI IZIN"}
      title={incoming ? "Izinkan masuk RTB" : "Tinjau izin keluar"}
      description={incoming ? "Cocokkan data mahasiswa sebelum mengizinkan ia kembali masuk RTB." : "Periksa data sebelum memberikan atau membatalkan izin. Menutup popup tidak akan mengubah status."}
      onClose={close}
    >
      <div className="overflow-hidden rounded-2xl border border-line bg-[#fafdff] dark:bg-surface">
        <div className="flex items-center justify-between gap-3 border-b border-line bg-safe-soft px-4 py-3 font-mono text-[10px] text-safe sm:px-5">
          <span className="flex items-center gap-1.5"><Check size={16} strokeWidth={1.8} /> QR DITEMUKAN</span>
          <span className={pill(permitTone(permit.status))}>{incoming ? "MENUNGGU MASUK" : "MENUNGGU KEPUTUSAN"}</span>
        </div>
        <div className="flex items-center gap-3.5 px-4 py-5 sm:px-5">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-signal-soft text-lg font-bold text-signal">{initials(permit.full_name)}</span>
          <div className="min-w-0">
            <h2 className="truncate text-xl font-semibold text-ink">{permit.full_name}</h2>
            <p className="mt-1 text-xs text-muted">{permit.class_name} · Kamar {permit.room_number}</p>
            <small className="font-mono text-[10px] text-muted">{incoming ? permit.entry_code : permit.permit_code}</small>
          </div>
        </div>
        <dl className="mx-4 grid gap-0 rounded-2xl border border-line bg-white px-4 sm:mx-5 dark:bg-surface">
          <div className="grid gap-1 border-b border-line py-3.5">
            <dt className="flex items-center gap-1.5 text-[11px] text-muted"><FileText size={14} /> Jenis izin</dt>
            <dd><span className="inline-flex rounded-pill bg-signal-soft px-2.5 py-1 text-xs font-semibold text-signal">{permitTypeLabel[permit.permit_type] ?? "Izin lainnya"}</span></dd>
          </div>
          <div className="grid gap-1 border-b border-line py-3.5">
            <dt className="flex items-center gap-1.5 text-[11px] text-muted"><MapPin size={14} /> Keterangan izin</dt>
            <dd className="whitespace-pre-wrap text-sm font-semibold leading-relaxed text-ink">{permit.destination}</dd>
          </div>
          <div className="grid gap-1 py-3.5">
            <dt className="flex items-center gap-1.5 text-[11px] text-muted"><Clock3 size={14} /> {incoming ? "Waktu kembali" : "Waktu keluar"}</dt>
            <dd className="text-sm font-semibold text-ink">{new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(incoming ? permit.planned_return_at : permit.planned_departure_at))}</dd>
          </div>
        </dl>
      </div>
      <form action={action} className="mt-5 grid gap-2.5">
        <input type="hidden" name="permitId" value={permit.id} />
        {state.error && <p className={formMessage("error")}>{state.error}</p>}
        {state.success && <p className={formMessage("success")}>{state.success}</p>}
        {incoming ? (
            <button name="decision" value="APPROVE" onClick={() => setDecision("APPROVE")} className={`${btn.base} ${btn.safe} w-full rounded-xl`} disabled={pending}>
            <ShieldCheck size={16} /> {pending ? "Memproses…" : "Izinkan masuk RTB"}
          </button>
        ) : (
          <div className="grid gap-2.5 sm:grid-cols-2">
            <button name="decision" value="REJECT" onClick={() => setDecision("REJECT")} className={`${btn.base} w-full rounded-xl border border-danger/30 bg-danger-soft text-danger hover:bg-danger hover:text-white`} disabled={pending}>
              {pending ? "Memproses…" : "Batalkan izin"}
            </button>
            <button name="decision" value="APPROVE" onClick={() => setDecision("APPROVE")} className={`${btn.base} ${btn.primary} w-full rounded-xl`} disabled={pending}>
              <UserRound size={16} /> {pending ? "Memproses…" : "Izinkan keluar"}
            </button>
          </div>
        )}
      </form>
    </FormModal>
  );
}
