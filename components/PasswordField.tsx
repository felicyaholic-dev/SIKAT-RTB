"use client";

import { useState, type ComponentProps } from "react";
import { Eye, EyeOff } from "lucide-react";

// Drop-in replacement for <input type="password">, everywhere one exists in
// the app — same props, plus a tap-to-reveal eye icon so a typo doesn't
// require blindly retyping. Visibility state is local/per-field, never sent
// anywhere; the input's own name/value still submit exactly like a normal
// password field once toggled back or on form submit either way.
export function PasswordField({ className = "", ...props }: Omit<ComponentProps<"input">, "type">) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input {...props} type={visible ? "text" : "password"} className={`pr-11 ${className}`} />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? "Sembunyikan password" : "Tampilkan password"}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 grid w-11 place-items-center text-muted transition-colors hover:text-signal"
      >
        {visible ? <EyeOff size={18} strokeWidth={1.7} /> : <Eye size={18} strokeWidth={1.7} />}
      </button>
    </div>
  );
}
