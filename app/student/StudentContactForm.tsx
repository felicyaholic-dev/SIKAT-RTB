"use client";

import { useActionState, useState } from "react";
import { Save } from "lucide-react";
import { updateOwnContactAction, type FormState } from "@/app/actions";
import { btn, formMessage } from "@/lib/ui";
import { wingFromRoom } from "@/lib/wings";

const initialState: FormState = {};

export function StudentContactForm({ room: initialRoom, phoneNumber, email }: { room: string; phoneNumber: string | null; email: string | null }) {
  const [room, setRoom] = useState(initialRoom);
  const [state, action, pending] = useActionState(updateOwnContactAction, initialState);
  const wing = wingFromRoom(room);
  return (
    <form action={action} className="security-card mt-5 p-6 sm:p-8">
      <p className="security-kicker">DATA HUNIAN & KONTAK</p>
      <h2 className="mt-2 text-lg font-medium tracking-tight text-ink">Kamar, nomor WA, dan email</h2>
      <p className="mt-1 text-sm text-muted">Data ini otomatis terlihat oleh Pengelola RTB dan dipakai untuk mengirim notifikasi izin.</p>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <label>
          Nomor kamar
          <input name="room" value={room} onChange={(e) => setRoom(e.target.value)} required />
          <small className="mt-1 block text-[10px] text-muted">
            {room.trim() === "" ? "Format WING-NOMOR, contoh A1-101." : wing ? `Wing ${wing.code} · ${wing.floor}.` : "Wing tidak dikenali. Gunakan format WING-NOMOR, contoh A1-101."}
          </small>
        </label>
        <label>
          Nomor WA <span className="font-normal text-muted">(opsional)</span>
          <input name="phoneNumber" inputMode="numeric" defaultValue={phoneNumber ?? ""} placeholder="08xxxxxxxxxx" />
        </label>
        <label className="sm:col-span-2">
          Email <span className="font-normal text-muted">(opsional, untuk notifikasi izin)</span>
          <input name="email" type="email" defaultValue={email ?? ""} placeholder="nama@email.com" />
        </label>
      </div>
      {state.error && <p className={`${formMessage("error")} mt-5`}>{state.error}</p>}
      {state.success && <p className={`${formMessage("success")} mt-5`}>{state.success}</p>}
      <div className="mt-6 flex justify-end border-t border-line pt-5">
        <button className={`${btn.base} ${btn.primary}`} disabled={pending}><Save size={16} /> {pending ? "Menyimpan…" : "Simpan perubahan"}</button>
      </div>
    </form>
  );
}
