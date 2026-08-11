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
    <div className="relative grid min-h-[255px] overflow-hidden border border-dashed border-signal/40 bg-white/50">
      <video ref={videoRef} playsInline muted className={scanning ? "h-full min-h-[255px] w-full object-cover" : "hidden"} />
      {!scanning && (
        <div className="grid justify-items-center gap-1 px-6 py-10 text-center">
          <Camera size={34} strokeWidth={1.5} className="text-signal" />
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
          className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 border border-line bg-white px-3 py-2 text-[11px] text-ink"
        >
          <CameraOff size={15} strokeWidth={1.6} /> Hentikan kamera
        </button>
      ) : (
        <button
          type="button"
          onClick={start}
          disabled={state === "starting"}
          className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 border border-line bg-white px-3 py-2 text-[11px] text-ink disabled:opacity-70"
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
