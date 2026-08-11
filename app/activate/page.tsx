import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { AuthShell } from "@/components/AuthShell";
import { ActivateForm } from "./ActivateForm";

export default function ActivatePage() {
  return (
    <AuthShell
      kicker="AKTIVASI PENGHUNI"
      heading={
        <>
          Pastikan datamu
          <br />
          <span className="text-signal">memang tercatat.</span>
        </>
      }
      lede="Aktivasi hanya tersedia untuk mahasiswa yang telah didaftarkan oleh pengelola RTB."
      noteIcon={BadgeCheck}
      note="ID BCA, nama lengkap, dan nomor kamar perlu sesuai dengan master data RTB."
      formKicker="AKTIVASI AKUN"
      title="Buat aksesmu."
      subtitle="Masukkan data persis seperti yang terdaftar di RTB, lalu buat password."
      footer={
        <p className="mt-6 text-center text-[13px] text-muted">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-semibold text-signal hover:underline">
            Masuk di sini
          </Link>
        </p>
      }
    >
      <ActivateForm />
    </AuthShell>
  );
}
