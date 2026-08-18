"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, LoaderCircle } from "lucide-react";

export function QrScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const frameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<"idle" | "starting" | "scanning" | "unsupported" | "denied">("idle");

  useEffect(() => () => stop(), []);

  function stop() {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (state === "scanning") setState("idle");
  }

  async function start() {
    if (!("BarcodeDetector" in window)) { setState("unsupported"); return; }
    try {
      setState("starting");
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();
      setState("scanning");
      const detector = new BarcodeDetector({ formats: ["qr_code"] });
      const detect = async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) { frameRef.current = requestAnimationFrame(detect); return; }
        try {
          const codes = await detector.detect(videoRef.current);
          if (codes[0]?.rawValue) { stop(); window.location.assign(`/security?code=${encodeURIComponent(codes[0].rawValue)}`); return; }
        } catch { /* Keep scanning; camera frames can occasionally be unavailable. */ }
        frameRef.current = requestAnimationFrame(detect);
      };
      frameRef.current = requestAnimationFrame(detect);
    } catch {
      setState("denied");
    }
  }

  const scanning = state === "scanning";

  return (
    <div className="security-scanner relative mt-6 grid min-h-[285px] overflow-hidden rounded-[18px] border border-[#cfeefa] bg-[#eaf8ff] dark:border-line dark:bg-mist">
      <i aria-hidden className="scanner-corner scanner-corner-tl" /><i aria-hidden className="scanner-corner scanner-corner-tr" /><i aria-hidden className="scanner-corner scanner-corner-bl" /><i aria-hidden className="scanner-corner scanner-corner-br" />
      <video ref={videoRef} playsInline muted className={scanning ? "h-full min-h-[285px] w-full object-cover" : "hidden"} />
      {!scanning && (
        <div className="relative z-[1] grid justify-items-center gap-1 px-6 py-10 text-center">
          <span className="grid h-20 w-20 place-items-center rounded-[25px] border border-[#75c8e6] bg-white/35 text-signal shadow-[inset_0_0_0_6px_rgb(255_255_255_/_0.25)]"><Camera size={35} strokeWidth={1.5} /></span>
          <b className="mt-4 font-mono text-[11px] tracking-[0.1em] text-ink">
            {state === "unsupported" ? "Scanner belum didukung browser ini" : state === "denied" ? "Izin kamera belum diberikan" : "Pindai QR izin"}
          </b>
          <small className="text-xs text-muted">
            {state === "unsupported" ? "Gunakan input kode izin sebagai alternatif." : "Gunakan kamera belakang perangkat untuk validasi cepat."}
          </small>
        </div>
      )}
      {scanning && <span aria-hidden className="pointer-events-none absolute inset-x-6 top-1/2 h-px bg-signal/50" />}
      {scanning ? (
        <button
          type="button"
          onClick={stop}
          className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2 text-[11px] text-ink shadow-sm dark:bg-surface"
        >
          <CameraOff size={15} strokeWidth={1.6} /> Hentikan kamera
        </button>
      ) : (
        <button
          type="button"
          onClick={start}
          disabled={state === "starting"}
          className="absolute right-4 top-4 z-10 flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2 text-[11px] font-semibold text-ink shadow-sm transition-colors hover:border-signal hover:text-signal disabled:opacity-70 dark:bg-surface"
        >
          {state === "starting" ? (
            <>
              <LoaderCircle size={15} className="animate-spin" /> Menyalakan…
            </>
          ) : (
            <>
              <Camera size={15} strokeWidth={1.6} /> Buka kamera
            </>
          )}
        </button>
      )}
    </div>
  );
}
