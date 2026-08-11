import { BrandMark } from "@/components/Brand";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-paper">
      <div className="flex flex-col items-center gap-5">
        <div className="animate-stamp">
          <BrandMark size={56} />
        </div>
        <p className="animate-fade-up font-mono text-[11px] tracking-[0.18em] text-muted" style={{ animationDelay: "0.15s" }}>
          MEMUAT SISTEM
        </p>
        <span className="h-[3px] w-40 overflow-hidden rounded-pill bg-line">
          <i aria-hidden className="animate-bar block h-full rounded-pill bg-signal not-italic" />
        </span>
      </div>
    </div>
  );
}
