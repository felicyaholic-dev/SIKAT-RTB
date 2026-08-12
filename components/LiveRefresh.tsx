"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function LiveRefresh({ everyMs = 5000 }: { everyMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const interval = window.setInterval(refresh, everyMs);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
    };
  }, [everyMs, router]);

  return <span className="inline-flex items-center gap-1.5 rounded-pill bg-signal-soft px-3 py-2 font-mono text-[10px] tracking-wide text-signal"><i aria-hidden className="h-1.5 w-1.5 animate-pulse rounded-full bg-signal" /> LIVE · 5 DTK</span>;
}
