export type Tone = "safe" | "amber" | "danger" | "muted";

const JAKARTA_TZ = "Asia/Jakarta";

// planned_departure_at/planned_return_at are naive wall-clock strings the
// student typed into a datetime-local input (e.g. "2026-08-19T14:30") — no
// timezone suffix, always meaning Jakarta local time. Without an explicit
// offset, `new Date()` reinterprets those digits using the server's own
// timezone (UTC in production), silently shifting the displayed time by
// hours. Anchor to Jakarta explicitly instead of relying on server tz.
export function formatJakartaInput(value: string, options: Intl.DateTimeFormatOptions) {
  const withOffset = /[Zz]|[+-]\d{2}:\d{2}$/.test(value) ? value : `${value}+07:00`;
  return new Intl.DateTimeFormat("id-ID", { ...options, timeZone: JAKARTA_TZ }).format(new Date(withOffset));
}

// created_at/occurred_at come from SQLite's CURRENT_TIMESTAMP, a real UTC
// instant stored without a "Z" suffix — append it before parsing so it isn't
// misread as server-local time, then always display in Jakarta time.
export function formatJakartaTimestamp(value: string, options: Intl.DateTimeFormatOptions) {
  const withZ = /[Zz]$/.test(value) ? value : `${value}Z`;
  return new Intl.DateTimeFormat("id-ID", { ...options, timeZone: JAKARTA_TZ }).format(new Date(withZ));
}

export const RESIDENT_CLASSES = [
  "PPBP 7",
  "PPBP 8",
  "PPBP 9",
  "PPBP 10",
  "PPTI 20",
  "PPTI 21",
  "PPTI 22",
  "PPTI 23",
  "PPTI 24",
  "PPTI 25",
  "PPTI 26",
  "PPTI 27",
  "PPTI 28",
] as const;

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
  if (status === "DIBATALKAN") return "danger";
  if (status === "MENUNGGU_KELUAR" || status === "MENUNGGU_MASUK") return "amber";
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
  primary: "bg-signal text-white hover:brightness-90",
  safe: "bg-safe text-white hover:brightness-90",
  outline: "border border-line bg-transparent text-ink hover:border-signal hover:text-signal",
};

export function formMessage(kind: "error" | "success") {
  const tone = kind === "error" ? "bg-danger-soft text-danger" : "bg-safe-soft text-safe";
  return `toast-msg rounded-panel px-4 py-3 text-[13px] leading-relaxed ${tone}`;
}
