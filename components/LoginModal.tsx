"use client";

import Link from "next/link";
import { useContext, createContext, useEffect, useRef, useState, type ReactNode } from "react";
import { LockKeyhole, X } from "lucide-react";
import { Brand } from "@/components/Brand";
import { LoginForm } from "@/app/login/LoginForm";
import { useFocusTrap } from "@/components/useFocusTrap";

const LoginModalContext = createContext<(() => void) | null>(null);

export function LoginModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  useFocusTrap(sectionRef, open);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("login") === "1") setOpen(true);
  }, []);

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

  const close = () => {
    setOpen(false);
    if (new URLSearchParams(window.location.search).has("login")) window.history.replaceState({}, "", window.location.pathname);
  };

  return (
    <LoginModalContext.Provider value={() => setOpen(true)}>
      {children}
      {open && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-[#062e4a]/60 p-4 backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="login-modal-title" onMouseDown={(event) => event.target === event.currentTarget && close()}>
          <section ref={sectionRef} tabIndex={-1} className="modal-enter relative w-full max-w-[520px] overflow-hidden rounded-[28px] border border-white/80 bg-white p-6 shadow-[0_32px_90px_rgb(0_37_62_/_0.35)] outline-none sm:p-9 dark:border-white/10 dark:bg-surface">
            <span aria-hidden className="absolute -right-20 -top-20 h-44 w-44 rounded-full bg-[#dbf5ff] blur-2xl dark:bg-signal/10" />
            <div className="relative flex items-start justify-between gap-4"><Brand /><button type="button" onClick={close} aria-label="Tutup form login" className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-white text-muted transition-all hover:border-signal hover:text-signal dark:bg-surface"><X size={19} /></button></div>
            <div className="relative mt-8"><h2 id="login-modal-title" className="text-[clamp(1.8rem,4vw,2.45rem)] font-medium tracking-[-0.055em] text-ink">Masuk ke SIKAT RTB</h2><p className="mt-2 text-sm leading-6 text-muted">Masukkan data akses yang telah terdaftar. Sistem akan membuka halaman sesuai akunmu.</p></div>
            <div className="relative mt-7"><LoginForm /></div>
            <div className="relative mt-6 flex items-center justify-center gap-2 text-center text-[11px] text-muted"><LockKeyhole size={14} className="text-signal" /> Hanya akun aktif yang terdaftar yang dapat masuk.</div>
            <p className="relative mt-4 text-center text-[12px] text-muted">Akun dibuat oleh Pengelola RTB. <Link href="/reset-password" onClick={close} className="font-bold text-signal hover:underline">Lupa password?</Link></p>
          </section>
        </div>
      )}
    </LoginModalContext.Provider>
  );
}

export function LoginTrigger({ children, className, ariaLabel }: { children: ReactNode; className?: string; ariaLabel?: string }) {
  const open = useContext(LoginModalContext);
  if (!open) throw new Error("LoginTrigger must be used inside LoginModalProvider.");
  return <button type="button" onClick={open} aria-label={ariaLabel} className={className}>{children}</button>;
}
