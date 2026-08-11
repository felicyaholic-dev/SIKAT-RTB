import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { AuthShell } from "@/components/AuthShell";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <AuthShell
      kicker="AKSES TERKONTROL"
      heading={
        <>
          Satu akun.
          <br />
          Satu peran.
          <br />
          <span className="text-signal">Satu pintu.</span>
        </>
      }
      lede="Masuk menggunakan ID BCA yang telah terdaftar. Sistem membuka workspace sesuai kewenangan akunmu."
      noteIcon={LockKeyhole}
      note="Role akun ditentukan oleh data RTB, bukan dipilih saat login."
      formKicker="MASUK SISTEM"
      title="Selamat datang kembali."
      subtitle="Gunakan ID BCA dan password akun SIKAT RTB."
      footer={
        <p className="mt-6 text-center text-[13px] text-muted">
          Belum pernah mengaktivasi akun?{" "}
          <Link href="/activate" className="font-semibold text-signal hover:underline">
            Aktivasi akun
          </Link>
          <br />
          <Link href="/reset-password" className="font-semibold text-signal hover:underline">
            Lupa password?
          </Link>
        </p>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}
