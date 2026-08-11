type MarkTone = "ink" | "light" | "signal";

const tones: Record<MarkTone, { ring: string; badge: string; check: string; stroke: string }> = {
  ink: { ring: "var(--color-ink)", badge: "var(--color-signal)", check: "#fff", stroke: "var(--color-paper)" },
  light: { ring: "#f7f4ec", badge: "#f7f4ec", check: "var(--color-navy)", stroke: "none" },
  signal: { ring: "var(--color-signal)", badge: "var(--color-ink)", check: "#fff", stroke: "var(--color-paper)" },
};

export function BrandMark({ tone = "ink", size = 40 }: { tone?: MarkTone; size?: number }) {
  const c = tones[tone];
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      {/* Seal: a permit stamp — double ring, a gate glyph, and a validated check. */}
      <circle cx="20" cy="20" r="17.25" stroke={c.ring} strokeWidth="1.6" />
      <circle cx="20" cy="20" r="13.5" stroke={c.ring} strokeWidth="1" strokeDasharray="1.5 3.2" opacity="0.55" />
      <path d="M13 15h14M14.5 15v12M25.5 15v12" stroke={c.ring} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="28.5" cy="28.5" r="7.25" fill={c.badge} stroke={c.stroke} strokeWidth="2" />
      <path d="M25.6 28.6l1.9 1.9 3.6-4" stroke={c.check} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <div className="inline-flex items-center gap-2.5">
      <BrandMark tone={light ? "light" : "ink"} size={36} />
      <span className="flex flex-col leading-none">
        <strong className={`text-[17px] font-bold tracking-tight ${light ? "text-white" : "text-ink"}`}>SIKAT</strong>
        <small className={`mt-1 font-mono text-[9px] font-medium tracking-[0.22em] ${light ? "text-white/60" : "text-muted"}`}>RUMAH TALENTA BCA</small>
      </span>
    </div>
  );
}
