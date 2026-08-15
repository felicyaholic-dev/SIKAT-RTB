"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BellRing, Megaphone, Send, Trash2, UsersRound } from "lucide-react";
import { createBroadcastAction, deleteBroadcastAction, type FormState } from "@/app/actions";
import { FormModal } from "@/components/FormModal";
import { btn, formMessage } from "@/lib/ui";

type Broadcast = { id: number; title: string; body: string; created_at: string; sender_name: string; recipient_count: number; read_count: number };
const initialState: FormState = {};

function timestamp(value: string) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(`${value}Z`));
}

export function NotificationBroadcast({ broadcasts }: { broadcasts: Broadcast[] }) {
  const [state, action, pending] = useActionState(createBroadcastAction, initialState);
  return (
    <section className="security-card mt-5 overflow-hidden p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="security-kicker">NOTIFIKASI</p>
          <h2 className="mt-2 text-lg font-medium tracking-tight text-ink">Broadcast ke seluruh pengguna</h2>
          <p className="mt-1 text-sm text-muted">Pesan langsung muncul di pusat notifikasi setiap akun aktif.</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-pill bg-signal-soft px-3 py-2 font-mono text-[10px] tracking-wide text-signal"><UsersRound size={14} /> SELURUH AKUN AKTIF</span>
      </div>
      <div className="grid gap-5 xl:grid-cols-[.82fr_1.18fr]">
        <form action={action} className="rounded-[20px] border border-[#d7edf6] bg-[linear-gradient(135deg,#fafdff,#edf9ff)] p-5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-signal shadow-sm"><Megaphone size={19} /></span>
          <h3 className="mt-4 text-base font-semibold tracking-tight text-ink">Tulis pengumuman</h3>
          <div className="mt-4 grid gap-4">
            <label>Judul<input name="title" maxLength={100} placeholder="Contoh: Pengingat jam malam" required /></label>
            <label>Isi notifikasi<textarea name="body" rows={5} maxLength={600} placeholder="Tulis informasi yang perlu diketahui seluruh pengguna…" required /></label>
          </div>
          {state.error && <p className={`${formMessage("error")} mt-4`}>{state.error}</p>}
          {state.success && <p className={`${formMessage("success")} mt-4`}>{state.success}</p>}
          <button className={`${btn.base} ${btn.primary} mt-5 w-full`} disabled={pending}><Send size={16} /> {pending ? "Mengirim…" : "Kirim ke semua user"}</button>
        </form>
        <div className="min-w-0 rounded-[20px] border border-line bg-white p-5">
          <div className="flex items-center justify-between gap-3"><div><p className="security-kicker">RIWAYAT KIRIM</p><h3 className="mt-1 text-base font-semibold tracking-tight text-ink">Pengumuman terakhir</h3></div><BellRing size={18} className="text-signal" /></div>
          <div className="mt-4 divide-y divide-line">
            {broadcasts.length ? broadcasts.map((item) => <article key={item.id} className="py-4 first:pt-0 last:pb-0"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h4 className="truncate text-sm font-semibold text-ink">{item.title}</h4><p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-muted">{item.body}</p></div><span className="flex shrink-0 items-center gap-2"><span className="rounded-pill bg-safe-soft px-2 py-1 font-mono text-[9px] text-safe">TERKIRIM</span><DeleteBroadcastButton id={item.id} title={item.title} /></span></div><p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted"><span>{timestamp(item.created_at)} · {item.sender_name}</span><span>{item.recipient_count} penerima · dibaca {item.read_count}</span></p></article>) : <div className="grid min-h-[220px] place-items-center text-center"><div><BellRing size={24} className="mx-auto text-signal" /><p className="mt-3 text-sm font-medium text-ink">Belum ada pengumuman</p><p className="mt-1 text-[12px] text-muted">Broadcast yang dikirim akan tercatat di sini.</p></div></div>}
          </div>
        </div>
      </div>
    </section>
  );
}

function DeleteBroadcastButton({ id, title }: { id: number; title: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(deleteBroadcastAction, initialState);

  useEffect(() => {
    if (state.success) {
      setOpen(false);
      router.refresh();
    }
  }, [router, state.success]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label={`Hapus notifikasi ${title}`} className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-muted transition-colors hover:bg-danger-soft hover:text-danger">
        <Trash2 size={13} />
      </button>
      {open && (
        <FormModal eyebrow="HAPUS NOTIFIKASI" title="Hapus pengumuman ini?" description={<>Notifikasi <b className="text-ink">&ldquo;{title}&rdquo;</b> akan hilang dari pusat notifikasi seluruh akun yang menerimanya. Tindakan ini tidak dapat dibatalkan &mdash; gunakan untuk notifikasi yang salah kirim.</>} onClose={() => setOpen(false)}>
          <form action={action} className="grid gap-3">
            <input type="hidden" name="notificationId" value={id} />
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
