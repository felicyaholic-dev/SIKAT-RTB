import Link from "next/link";
import { Mail } from "lucide-react";
import { AuthShell } from "@/components/AuthShell";
import { ManagerResetRequestForm } from "./ManagerResetRequestForm";

export default function ManagerResetPasswordPage() {
  return (
    <AuthShell
      backHref="/login"
      backLabel="Kembali ke masuk"
      kicker="PULIHKAN AKSES PENGELOLA"
      heading={
        <>
          Reset password
          <br />
          <span className="text-signal">Pengelola.</span>
        </>
      }
      lede="Berbeda dari mahasiswa, akun Pengelola direset lewat tautan yang dikirim ke email terdaftar — bukan verifikasi data."
      noteIcon={Mail}
      note="Butuh email yang sudah diisi di halaman Profil sebelumnya. Tautan berlaku 30 menit dan hanya sekali pakai."
      formKicker="RESET PASSWORD PENGELOLA"
      title="Masukkan ID BCA."
      subtitle="Kami kirim tautan reset ke email yang terdaftar untuk akun ini, kalau ada."
      footer={
        <p className="mt-6 text-center text-[13px] text-muted">
          Bukan Pengelola?{" "}
          <Link href="/reset-password" className="font-semibold text-signal hover:underline">
            Reset password mahasiswa
          </Link>
        </p>
      }
    >
      <ManagerResetRequestForm />
    </AuthShell>
  );
}
