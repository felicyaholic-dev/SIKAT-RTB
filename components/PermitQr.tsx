"use client";

import { useEffect, useState } from "react";
import { BrandMark } from "@/components/Brand";

// No web page can block an OS-level screenshot or screen recording — that
// requires native APIs (e.g. iOS's capturedDidChangeNotification, Android's
// FLAG_SECURE) this app doesn't have as a browser page. What's real here:
// disabling long-press/right-click save (.qr-protected, see globals.css),
// and blurring the code while the tab is backgrounded so it isn't sitting
// exposed in an OS task-switcher thumbnail or a shoulder-surf during a
// quick app switch. The actual security backstop is that the QR is
// single-use and stops working the moment satpam validates it, screenshot
// or not.
export function PermitQr({ svg, className = "", animated = true }: { svg: string; className?: string; animated?: boolean }) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const updateHidden = () => setHidden(document.visibilityState === "hidden" || !document.hasFocus());
    document.addEventListener("visibilitychange", updateHidden);
    window.addEventListener("blur", updateHidden);
    window.addEventListener("focus", updateHidden);
    return () => {
      document.removeEventListener("visibilitychange", updateHidden);
      window.removeEventListener("blur", updateHidden);
      window.removeEventListener("focus", updateHidden);
    };
  }, []);

  return (
    <div className={`group relative shrink-0 ${className}`} onContextMenu={(e) => e.preventDefault()}>
      {animated && <span aria-hidden className="animate-glow absolute -inset-2 rounded-full bg-signal/35 blur-lg" />}
      <div className={`qr-protected relative aspect-square overflow-hidden rounded-[6px] border border-line bg-white p-2 transition-all duration-200 group-hover:scale-105 ${hidden ? "blur-xl" : ""}`}>
        <div className="h-full w-full [&_svg]:block" dangerouslySetInnerHTML={{ __html: svg }} />
        {animated && (
          <span
            aria-hidden
            className="animate-scan pointer-events-none absolute inset-x-1 h-[2px] bg-gradient-to-r from-transparent via-signal to-transparent shadow-[0_0_8px_var(--color-signal)]"
          />
        )}
        <span aria-hidden className="absolute top-1/2 left-1/2 grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white p-[3px] shadow-[0_0_0_2px_white]">
          <BrandMark size={18} />
        </span>
      </div>
    </div>
  );
}
