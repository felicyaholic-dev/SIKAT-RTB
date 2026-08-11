import { BrandMark } from "@/components/Brand";

export function PermitQr({ svg, className = "", animated = true }: { svg: string; className?: string; animated?: boolean }) {
  return (
    <div className={`group relative shrink-0 ${className}`}>
      {animated && <span aria-hidden className="animate-glow absolute -inset-2 rounded-full bg-signal/35 blur-lg" />}
      <div className="relative aspect-square overflow-hidden rounded-[6px] border border-line bg-white p-2 transition-transform duration-200 group-hover:scale-105">
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
