"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useFocusTrap } from "@/components/useFocusTrap";

type FormModalProps = {
  eyebrow: string;
  title: string;
  description?: ReactNode;
  onClose: () => void;
  children: ReactNode;
};

export function FormModal({ eyebrow, title, description, onClose, children }: FormModalProps) {
  const headingId = `form-modal-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const [mounted, setMounted] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  useFocusTrap(sectionRef, mounted);

  useEffect(() => {
    setMounted(true);
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex min-w-0 items-center justify-center overflow-x-hidden bg-[#062e4a]/60 p-4 backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby={headingId} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section ref={sectionRef} tabIndex={-1} className="modal-enter relative max-h-[calc(100dvh-32px)] w-[calc(100vw-2rem)] max-w-[520px] min-w-0 overflow-x-hidden overflow-y-auto overscroll-contain rounded-[28px] border border-white/80 bg-white p-6 shadow-[0_32px_90px_rgb(0_37_62_/_0.35)] outline-none sm:p-9 dark:border-white/10 dark:bg-surface">
        <span aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full bg-[#dbf5ff] blur-2xl dark:bg-signal/10" />
        <span aria-hidden className="pointer-events-none absolute -bottom-24 -left-20 h-40 w-40 rounded-full bg-[#eaf8ff] blur-2xl dark:bg-signal/5" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] font-bold tracking-[0.14em] text-signal">{eyebrow}</p>
            <h2 id={headingId} className="mt-2 text-[clamp(1.65rem,4vw,2.25rem)] font-medium tracking-[-0.055em] text-ink">{title}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Tutup formulir" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line bg-white text-muted transition-all hover:border-signal hover:text-signal dark:bg-surface">
            <X size={19} />
          </button>
        </div>
        {description && <div className="relative mt-2 text-sm leading-6 text-muted">{description}</div>}
        <div className="relative mt-7">{children}</div>
      </section>
    </div>,
    document.body,
  );
}
