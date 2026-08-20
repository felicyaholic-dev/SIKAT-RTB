"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Bell, BellRing, CheckCheck, X } from "lucide-react";
import { formatJakartaTimestamp } from "@/lib/ui";
import { useFocusTrap } from "@/components/useFocusTrap";

type Notification = { id: number; title: string; body: string; created_at: string; sender_name: string; read_at: string | null };
type Payload = { notifications: Notification[]; unread: number };

function when(value: string) {
  return formatJakartaTimestamp(value, { dateStyle: "medium", timeStyle: "short" });
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<Payload>({ notifications: [], unread: 0 });
  const [loaded, setLoaded] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  useFocusTrap(sectionRef, open && mounted);

  const load = async () => {
    const response = await fetch("/api/notifications", { cache: "no-store" });
    if (!response.ok) return null;
    const payload = await response.json() as Payload;
    setData(payload);
    setLoaded(true);
    return payload;
  };

  useEffect(() => { setMounted(true); void load(); }, []);
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const openCenter = async () => {
    setOpen(true);
    const latest = await load();
    if (latest && latest.unread > 0) {
      await fetch("/api/notifications", { method: "POST" });
      setData((current) => ({ ...current, unread: 0, notifications: current.notifications.map((item) => ({ ...item, read_at: item.read_at || "now" })) }));
    }
  };

  const dialog = open && mounted ? createPortal(
    <div className="fixed inset-0 z-[70] flex min-w-0 items-center justify-center overflow-x-hidden bg-[#062e4a]/60 p-4 backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="notification-center-title" onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}>
      <section ref={sectionRef} tabIndex={-1} className="modal-enter relative flex max-h-[calc(100dvh-32px)] w-[calc(100vw-2rem)] max-w-[520px] min-w-0 flex-col overflow-hidden rounded-[28px] border border-white/80 bg-white shadow-[0_32px_90px_rgb(0_37_62_/_0.35)] outline-none dark:border-white/10 dark:bg-surface">
        <span aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full bg-[#dbf5ff] blur-2xl dark:bg-signal/10" />
        <header className="relative flex items-start justify-between gap-4 border-b border-line px-6 py-5 sm:px-8 sm:py-6"><div><p className="font-mono text-[10px] font-bold tracking-[0.14em] text-signal">PUSAT NOTIFIKASI</p><h2 id="notification-center-title" className="mt-2 text-[clamp(1.55rem,4vw,2.1rem)] font-medium tracking-[-0.055em] text-ink">Info dari Pengelola</h2><p className="mt-1 text-sm text-muted">Pengumuman untuk akunmu.</p></div><button type="button" onClick={() => setOpen(false)} aria-label="Tutup notifikasi" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line bg-white text-muted transition-all hover:border-signal hover:text-signal dark:bg-surface"><X size={19} /></button></header>
        <div className="relative min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
          {!loaded ? <p className="px-3 py-10 text-center text-sm text-muted">Memuat notifikasi…</p> : data.notifications.length ? data.notifications.map((item) => <article key={item.id} className="rounded-2xl px-4 py-4 transition-colors hover:bg-signal-soft/45"><div className="flex gap-3"><span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.read_at ? "bg-line" : "bg-signal"}`} /><div className="min-w-0"><h3 className="text-sm font-bold text-ink">{item.title}</h3><p className="mt-1.5 text-[13px] leading-relaxed text-muted">{item.body}</p><p className="mt-2.5 text-[10px] text-muted">{when(item.created_at)} · {item.sender_name}</p></div></div></article>) : <div className="grid min-h-52 place-items-center text-center"><div><CheckCheck size={28} className="mx-auto text-safe" /><p className="mt-3 text-sm font-semibold text-ink">Belum ada notifikasi</p><p className="mt-1 text-[12px] text-muted">Pengumuman dari pengelola akan muncul di sini.</p></div></div>}
        </div>
      </section>
    </div>,
    document.body,
  ) : null;

  return <><button type="button" aria-label="Notifikasi" aria-expanded={open} onClick={() => { void openCenter(); }} className="relative grid h-9 w-9 place-items-center rounded-xl border border-line bg-white text-muted transition-colors hover:text-signal dark:bg-surface">{data.unread ? <BellRing size={16} className="text-signal" /> : <Bell size={16} />}{data.unread > 0 && <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-danger px-1 font-mono text-[8px] font-bold text-white">{data.unread > 9 ? "9+" : data.unread}</span>}</button>{dialog}</>;
}
