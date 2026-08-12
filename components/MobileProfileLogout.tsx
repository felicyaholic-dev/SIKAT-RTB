import { LogOut } from "lucide-react";
import { logoutAction } from "@/app/actions";

export function MobileProfileLogout() {
  return (
    <section className="security-card mt-5 p-5 md:hidden">
      <p className="security-kicker">SESI AKUN</p>
      <p className="mt-2 text-sm leading-relaxed text-muted">Keluar dari perangkat ini jika akun tidak lagi digunakan.</p>
      <form action={logoutAction} className="mt-4">
        <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-danger/25 bg-danger-soft px-4 py-3 text-sm font-bold text-danger transition-colors active:scale-[0.99]">
          <LogOut size={17} /> Keluar dari akun
        </button>
      </form>
    </section>
  );
}
