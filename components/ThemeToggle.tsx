"use client";

import { Moon, MonitorSmartphone, Sun } from "lucide-react";
import { useTheme, type Theme } from "@/components/ThemeProvider";

const ORDER: Theme[] = ["light", "dark", "system"];
const META: Record<Theme, { icon: typeof Sun; label: string }> = {
  light: { icon: Sun, label: "Terang" },
  dark: { icon: Moon, label: "Gelap" },
  system: { icon: MonitorSmartphone, label: "Ikuti sistem" },
};

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
  const Icon = META[theme].icon;
  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={`Tema saat ini: ${META[theme].label}. Klik untuk ganti ke ${META[next].label}.`}
      title={`Tema: ${META[theme].label}`}
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-line bg-surface text-muted transition-colors hover:text-signal ${className}`}
    >
      <Icon size={16} strokeWidth={1.6} />
    </button>
  );
}
