export type Tone = "safe" | "amber" | "danger" | "muted";

const toneClasses: Record<Tone, string> = {
  safe: "bg-safe-soft text-safe",
  amber: "bg-amber-soft text-amber",
  danger: "bg-danger-soft text-danger",
  muted: "bg-mist text-muted",
};

const toneDotClasses: Record<Tone, string> = {
  safe: "bg-safe",
  amber: "bg-amber",
  danger: "bg-danger",
  muted: "bg-muted",
};

const toneTextClasses: Record<Tone, string> = {
  safe: "text-safe",
  amber: "text-amber",
  danger: "text-danger",
  muted: "text-muted",
};

export function pill(tone: Tone, extra = "") {
  return `inline-flex items-center whitespace-nowrap rounded-pill px-2.5 py-1.5 font-mono text-[10px] tracking-wide ${toneClasses[tone]} ${extra}`;
}

export function toneDot(tone: Tone) {
  return toneDotClasses[tone];
}

export function toneText(tone: Tone) {
  return toneTextClasses[tone];
}

export function permitTone(status: string | undefined): Tone {
  if (!status) return "muted";
  if (status === "SELESAI") return "safe";
  if (status === "SEDANG_DI_LUAR") return "amber";
  return "muted";
}

export function permitStatusLabel(status: string) {
  const labels: Record<string, string> = {
    MENUNGGU_KELUAR: "Menunggu keputusan satpam",
    SEDANG_DI_LUAR: "Sedang di luar RTB",
    MENUNGGU_MASUK: "Menunggu validasi masuk",
    SELESAI: "Izin selesai",
    DIBATALKAN: "Izin dibatalkan",
  };
  return labels[status] ?? status.replaceAll("_", " ");
}

export function initials(name: string, max = 2) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, max)
    .join("")
    .toUpperCase();
}

export const btn = {
  base: "inline-flex items-center justify-center gap-2 rounded-panel px-5 min-h-11 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:shadow-none disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0 disabled:hover:shadow-none",
  primary: "bg-signal text-white hover:bg-ink",
  ink: "bg-navy text-white hover:bg-ink",
  safe: "bg-safe text-white hover:brightness-90",
  outline: "border border-line bg-transparent text-ink hover:border-signal hover:text-signal",
  white: "bg-white text-navy hover:bg-paper",
};

export function formMessage(kind: "error" | "success") {
  const tone = kind === "error" ? "bg-danger-soft text-danger" : "bg-safe-soft text-safe";
  return `toast-msg rounded-panel px-4 py-3 text-[13px] leading-relaxed ${tone}`;
}
