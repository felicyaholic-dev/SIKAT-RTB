"use client";

import { useEffect, useState } from "react";
import { BrandMark } from "@/components/Brand";

/**
 * One-time brand intro shown on first paint of a fresh page load (mounted in
 * the root layout, so client-side <Link> navigations never remount it and
 * re-trigger the animation). Purely decorative — the real page is already
 * rendered underneath — so it's skipped entirely under reduced-motion.
 */
export function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(false);
      return;
    }
    const leaveTimer = setTimeout(() => setLeaving(true), 1050);
    const hideTimer = setTimeout(() => setVisible(false), 1500);
    return () => {
      clearTimeout(leaveTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden
      className={`bg-hero-sky fixed inset-0 z-50 grid place-items-center transition-opacity duration-500 ease-out ${
        leaving ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center gap-5">
        <div className="animate-stamp">
          <BrandMark size={60} />
        </div>
        <p className="animate-fade-up font-mono text-[11px] tracking-[0.18em] text-muted" style={{ animationDelay: "0.2s" }}>
          SISTEM IZIN KELUAR-MASUK TERINTEGRASI
        </p>
        <span className="h-[3px] w-40 overflow-hidden rounded-pill bg-line">
          <i aria-hidden className="animate-bar block h-full rounded-pill bg-signal not-italic" />
        </span>
      </div>
    </div>
  );
}
