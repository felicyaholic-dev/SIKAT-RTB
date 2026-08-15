type MarkTone = "ink" | "light" | "signal";

export function BrandMark({ size = 40 }: { tone?: MarkTone; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" aria-hidden>
      <defs>
        <linearGradient id="brandMarkBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--color-signal-2)" />
          <stop offset="100%" stopColor="var(--color-signal)" />
        </linearGradient>
      </defs>
      <rect x="46" y="46" width="420" height="420" rx="120" fill="url(#brandMarkBg)" />
      <path d="M165,238 L256,146 L347,238" fill="none" stroke="#fff" strokeWidth="37" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M208,342 L208,275 A48,48 0 0 1 304,275 L304,342" fill="none" stroke="#fff" strokeWidth="32" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="422" cy="90" r="58" fill="#fff" />
      <path d="M400,112 L444,68 M444,68 L444,84 M444,68 L428,68" fill="none" stroke="var(--color-signal)" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="90" cy="422" r="58" fill="#fff" />
      <path d="M112,400 L68,444 M68,444 L68,428 M68,444 L84,444" fill="none" stroke="var(--color-signal)" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <div className="inline-flex items-center gap-2.5">
      <BrandMark size={36} />
      <span className="flex flex-col leading-none">
        <strong className={`font-display text-[18px] font-bold tracking-tight ${light ? "text-white" : "text-signal"}`}>SIKAT</strong>
        <small className={`mt-1 font-mono text-[9px] font-medium tracking-[0.22em] ${light ? "text-white/60" : "text-muted"}`}>RUMAH TALENTA BCA</small>
      </span>
    </div>
  );
}
