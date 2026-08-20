import { KeyRound } from "lucide-react";
import { AuthShell } from "@/components/AuthShell";
import { ManagerResetConfirmForm } from "./ManagerResetConfirmForm";

export default async function ManagerResetConfirmPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <AuthShell
      backHref="/login"
      backLabel="Kembali ke masuk"
      kicker="PULIHKAN AKSES PENGELOLA"
      heading={
        <>
          Atur password
          <br />
          <span className="text-signal">baru.</span>
        </>
      }
      lede="Tautan ini hanya berlaku sekali dan kedaluwarsa 30 menit setelah diminta."
      noteIcon={KeyRound}
      note="Kalau tautan sudah kedaluwarsa atau dipakai, minta tautan baru dari halaman reset password Pengelola."
      formKicker="RESET PASSWORD PENGELOLA"
      title="Tentukan password baru."
      subtitle="Gunakan minimal 8 karakter untuk menjaga keamanan akun."
    >
      <ManagerResetConfirmForm token={token ?? ""} />
    </AuthShell>
  );
}
