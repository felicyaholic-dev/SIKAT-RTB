import Link from "next/link";
import { KeyRound } from "lucide-react";
import { AuthShell } from "@/components/AuthShell";
import { ResetPasswordForm } from "./ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <AuthShell
      backHref="/login"
      backLabel="Kembali ke masuk"
      kicker="PULIHKAN AKSES"
      heading={
        <>
          Atur ulang
          <br />
          <span className="text-signal">password.</span>
        </>
      }
      lede="Untuk melindungi akun, data yang dimasukkan perlu sesuai dengan master penghuni RTB."
      noteIcon={KeyRound}
      note="Reset mandiri tersedia untuk akun mahasiswa yang sudah pernah diaktivasi."
      formKicker="RESET PASSWORD"
      title="Verifikasi datamu."
      subtitle="Masukkan data terdaftar, lalu tentukan password baru."
      footer={
        <p className="mt-6 text-center text-[13px] text-muted">
          Ingat password?{" "}
          <Link href="/login" className="font-semibold text-signal hover:underline">
            Masuk di sini
          </Link>
        </p>
      }
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
