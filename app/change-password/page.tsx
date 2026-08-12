import { KeyRound } from "lucide-react";
import { AuthShell } from "@/components/AuthShell";
import { ChangePasswordForm } from "./ChangePasswordForm";

export default function ChangePasswordPage() {
  return <AuthShell kicker="KEAMANAN AKUN" heading={<>Buat password<br /><span className="text-signal">pribadimu.</span></>} lede="Password awal hanya digunakan untuk masuk pertama kali. Buat password yang hanya kamu ketahui." noteIcon={KeyRound} note="Kamu harus menyelesaikan langkah ini sebelum mengakses sistem." formKicker="LOGIN PERTAMA" title="Ganti password awal" subtitle="Gunakan minimal 8 karakter untuk menjaga keamanan akunmu."><ChangePasswordForm /></AuthShell>;
}
