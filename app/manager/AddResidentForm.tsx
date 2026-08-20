"use client";

import { useState, useActionState } from "react";
import { Plus } from "lucide-react";
import { addResidentAction, type FormState } from "@/app/actions";
import { FormModal } from "@/components/FormModal";
import { PasswordField } from "@/components/PasswordField";
import { btn, formMessage, RESIDENT_CLASSES } from "@/lib/ui";
import { genderLabel, wingFromRoom } from "@/lib/wings";

const initialState: FormState = {};

export function AddResidentForm() {
  const [open, setOpen] = useState(false);
  const [room, setRoom] = useState("");
  const [state, action, pending] = useActionState(addResidentAction, initialState);
  const wing = wingFromRoom(room);
  return (
    <>
      <button className={`${btn.base} ${btn.primary} shrink-0`} onClick={() => setOpen(true)}>
        <Plus size={16} /> Tambah penghuni
      </button>
      {open && (
        <FormModal eyebrow="MASTER PENGHUNI" title="Tambah penghuni" description="Masukkan data utama dan password awal. Mahasiswa wajib mengganti password saat login pertama." onClose={() => setOpen(false)}>
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
                  <input name="room" placeholder="A1-101" value={room} onChange={(e) => setRoom(e.target.value)} required />
                  <small className="mt-1 block text-[10px] text-muted">
                    {room.trim() === "" ? "Format WING-NOMOR, contoh A1-101." : wing ? `Wing ${wing.code} · ${wing.floor} · khusus ${genderLabel(wing.gender)}.` : "Wing tidak dikenali. Gunakan format WING-NOMOR, contoh A1-101."}
                  </small>
                </label>
                <label>
                  Kelas
                  <select name="className" defaultValue="" required>
                    <option value="" disabled>Pilih kelas</option>
                    {RESIDENT_CLASSES.map((className) => (
                      <option key={className} value={className}>{className}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label>
                  Jenis kelamin
                  <select name="gender" defaultValue="" required>
                    <option value="" disabled>Pilih jenis kelamin</option>
                    <option value="LAKI_LAKI">Laki-laki</option>
                    <option value="PEREMPUAN">Perempuan</option>
                  </select>
                </label>
                <label>
                  Nomor WA <span className="font-normal text-muted">(opsional)</span>
                  <input name="phoneNumber" inputMode="numeric" placeholder="08xxxxxxxxxx" />
                </label>
              </div>
              <label>
                Email <span className="font-normal text-muted">(opsional, untuk notifikasi izin)</span>
                <input name="email" type="email" placeholder="nama@email.com" />
              </label>
              <label>
                Password awal
                <PasswordField name="password" minLength={8} placeholder="Minimal 8 karakter" required />
              </label>
              {state.error && <p className={formMessage("error")}>{state.error}</p>}
              {state.success && <p className={formMessage("success")}>{state.success}</p>}
              <button className={`${btn.base} ${btn.primary} w-full`} disabled={pending}>
                {pending ? "Menyimpan…" : "Simpan ke master data"}
              </button>
            </form>
        </FormModal>
      )}
    </>
  );
}
