"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, BellRing, CheckCheck, X } from "lucide-react";

type Notification = { id: number; title: string; body: string; created_at: string; sender_name: string; read_at: string | null };
type Payload = { notifications: Notification[]; unread: number };

function when(value: string) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(`${value}Z`));
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<Payload>({ notifications: [], unread: 0 });
  const [loaded, setLoaded] = useState(false);
  const panel = useRef<HTMLDivElement>(null);

  const load = async () => {
    const response = await fetch("/api/notifications", { cache: "no-store" });
    if (!response.ok) return null;
    const payload = await response.json() as Payload;
    setData(payload);
    setLoaded(true);
    return payload;
  };

  useEffect(() => { void load(); }, []);
  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => !panel.current?.contains(event.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (!next) return;
    const latest = await load();
    if (latest && latest.unread > 0) {
      await fetch("/api/notifications", { method: "POST" });
      setData((current) => ({ ...current, unread: 0, notifications: current.notifications.map((item) => ({ ...item, read_at: item.read_at || "now" })) }));
    }
  };

  return (
    <div ref={panel} className="relative">
      <button type="button" aria-label="Notifikasi" aria-expanded={open} onClick={toggle} className="relative grid h-9 w-9 place-items-center rounded-xl border border-line bg-white text-muted transition-colors hover:text-signal">
        {data.unread ? <BellRing size={16} className="text-signal" /> : <Bell size={16} />}
        {data.unread > 0 && <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-danger px-1 font-mono text-[8px] font-bold text-white">{data.unread > 9 ? "9+" : data.unread}</span>}
      </button>
      {open && <section className="modal-enter absolute right-0 top-12 z-50 w-[min(360px,calc(100vw-2.5rem))] overflow-hidden rounded-[22px] border border-white/80 bg-white shadow-[0_24px_55px_rgb(0_37_62_/_0.22)]">
        <header className="flex items-center justify-between border-b border-line px-5 py-4"><div><p className="security-kicker">PUSAT NOTIFIKASI</p><h2 className="mt-1 text-base font-semibold tracking-tight text-ink">Info dari Pengelola</h2></div><button type="button" onClick={() => setOpen(false)} aria-label="Tutup notifikasi" className="text-muted hover:text-signal"><X size={17} /></button></header>
        <div className="max-h-[min(430px,calc(100dvh-120px))] overflow-y-auto p-2">
          {!loaded ? <p className="px-3 py-8 text-center text-xs text-muted">Memuat notifikasi…</p> : data.notifications.length ? data.notifications.map((item) => <article key={item.id} className="rounded-2xl px-3 py-3 transition-colors hover:bg-signal-soft/45"><div className="flex gap-3"><span className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${item.read_at ? "bg-line" : "bg-signal"}`} /><div className="min-w-0"><h3 className="text-[13px] font-bold text-ink">{item.title}</h3><p className="mt-1 text-[12px] leading-relaxed text-muted">{item.body}</p><p className="mt-2 text-[10px] text-muted">{when(item.created_at)} · {item.sender_name}</p></div></div></article>) : <div className="grid min-h-44 place-items-center text-center"><div><CheckCheck size={24} className="mx-auto text-safe" /><p className="mt-3 text-sm font-semibold text-ink">Belum ada notifikasi</p><p className="mt-1 text-[11px] text-muted">Pengumuman dari pengelola akan muncul di sini.</p></div></div>}
        </div>
      </section>}
    </div>
  );
}
