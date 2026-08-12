"use client";

import { useActionState, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { addSecurityStaffAction, type FormState, updateSecurityStaffAction } from "@/app/actions";
import { FormModal } from "@/components/FormModal";
import { btn, formMessage, initials, pill } from "@/lib/ui";

const initialState: FormState = {};
type Staff = { id: number; bca_id: string; full_name: string; shift_label: string; gender: string; staff_status: string };

export function SecurityStaffControl({ staff }: { staff: Staff[] }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(addSecurityStaffAction, initialState);
  return (
    <section className="security-card mt-5 p-5 sm:p-6">
      <div className="mb-3.5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="security-kicker">AKSES POS KEAMANAN</p>
          <h2 className="mt-2 text-lg font-medium tracking-tight">Master satpam</h2>
          <p className="mt-1 text-sm text-muted">ID BCA satpam terdiri dari 6 angka dan seluruh akses dikelola pengelola.</p>
        </div>
        <button className={`${btn.base} ${btn.primary} shrink-0`} onClick={() => setOpen(true)}>
          <Plus size={16} /> Tambah satpam
        </button>
      </div>
      <div className="overflow-auto rounded-xl border border-line bg-white">
        <table className="w-full min-w-[600px] border-collapse">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left font-mono text-[10px] font-medium tracking-wide text-muted">Satpam</th>
              <th className="px-4 py-3 text-left font-mono text-[10px] font-medium tracking-wide text-muted">ID BCA</th>
              <th className="px-4 py-3 text-left font-mono text-[10px] font-medium tracking-wide text-muted">Shift</th>
              <th className="px-4 py-3 text-left font-mono text-[10px] font-medium tracking-wide text-muted">Jenis kelamin</th>
              <th className="px-4 py-3 text-left font-mono text-[10px] font-medium tracking-wide text-muted">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {staff.map((item) => (
              <tr key={item.id} className="border-t border-line transition-colors duration-150 hover:bg-signal-soft/40">
                <td className="px-4 py-3">
                  <span className="flex items-center gap-2.5">
                    <i className="grid h-7 w-7 place-items-center bg-signal-soft text-[9px] font-bold text-navy not-italic">{initials(item.full_name)}</i>
                    <span>
                      <b className="block text-xs">{item.full_name}</b>
                      <small className="text-[10px] text-muted">Akses validasi gerbang</small>
                    </span>
                  </span>
                </td>
                <td className="px-4 py-3">
                  <code className="font-mono text-[10px] text-muted">{item.bca_id}</code>
                </td>
                <td className="px-4 py-3 text-xs">{item.shift_label}</td>
                <td className="px-4 py-3 text-xs text-muted">{item.gender === "PEREMPUAN" ? "Perempuan" : item.gender === "LAKI_LAKI" ? "Laki-laki" : "—"}</td>
                <td className="px-4 py-3">
                  <span className={pill(item.staff_status === "ACTIVE" ? "safe" : "muted")}>{item.staff_status === "ACTIVE" ? "AKTIF" : "NONAKTIF"}</span>
                </td>
                <td className="px-4 py-3">
                  <EditStaff staff={item} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {open && (
        <FormModal eyebrow="AKUN SATPAM" title="Tambah satpam" description="Buat akses validasi gerbang beserta password awal untuk petugas." onClose={() => setOpen(false)}>
            <form action={action} className="grid gap-4">
              <label>
                ID BCA · 6 angka
                <input name="bcaId" inputMode="numeric" pattern="[0-9]{6}" placeholder="900001" required />
              </label>
              <label>
                Nama lengkap
                <input name="fullName" required />
              </label>
              <label>
                Shift
                <input name="shiftLabel" placeholder="Shift sore" required />
              </label>
              <label>
                Jenis kelamin
                <select name="gender" defaultValue="" required>
                  <option value="" disabled>Pilih jenis kelamin</option>
                  <option value="LAKI_LAKI">Laki-laki</option>
                  <option value="PEREMPUAN">Perempuan</option>
                </select>
              </label>
              <label>
                Password awal
                <input name="password" type="password" minLength={8} required />
              </label>
              {state.error && <p className={formMessage("error")}>{state.error}</p>}
              {state.success && <p className={formMessage("success")}>{state.success}</p>}
              <button className={`${btn.base} ${btn.primary} w-full`} disabled={pending}>
                {pending ? "Menyimpan…" : "Buat akun satpam"}
              </button>
            </form>
        </FormModal>
      )}
    </section>
  );
}

function EditStaff({ staff }: { staff: Staff }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(updateSecurityStaffAction, initialState);
  return (
    <>
      <button className="grid h-8 w-8 place-items-center bg-signal-soft text-navy transition-colors hover:bg-signal hover:text-white" onClick={() => setOpen(true)}>
        <Pencil size={15} />
      </button>
      {open && (
        <FormModal eyebrow="EDIT AKSES SATPAM" title={staff.full_name} onClose={() => setOpen(false)} description={<>
              ID BCA <code className="rounded bg-mist px-1.5 py-0.5 font-mono text-[11px] text-ink">{staff.bca_id}</code> tidak dapat diubah.
            </>}>
            <form action={action} className="grid gap-4">
              <input type="hidden" name="id" value={staff.id} />
              <label>
                Nama lengkap
                <input name="fullName" defaultValue={staff.full_name} required />
              </label>
              <label>
                Shift
                <input name="shiftLabel" defaultValue={staff.shift_label} required />
              </label>
              <label>
                Jenis kelamin
                <select name="gender" defaultValue={["LAKI_LAKI", "PEREMPUAN"].includes(staff.gender) ? staff.gender : ""} required>
                  <option value="" disabled>Pilih jenis kelamin</option>
                  <option value="LAKI_LAKI">Laki-laki</option>
                  <option value="PEREMPUAN">Perempuan</option>
                </select>
              </label>
              <label>
                Status
                <select name="staffStatus" defaultValue={staff.staff_status}>
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
