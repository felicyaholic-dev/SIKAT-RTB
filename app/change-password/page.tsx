import { KeyRound } from "lucide-react";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { requireSession, roleHome } from "@/lib/auth";
import { ChangePasswordForm } from "./ChangePasswordForm";

// This route is only for the forced first-login change. Once that's done,
// Mahasiswa/Satpam have no further access to it (see changePasswordAction);
// Pengelola use the voluntary form on /manager/profile instead — so once
// mustChangePassword is false, nobody has a reason to be on this page.
export default async function ChangePasswordPage() {
  const session = await requireSession();
  if (!session.mustChangePassword) redirect(roleHome(session.role));
  return <AuthShell kicker="KEAMANAN AKUN" heading={<>Buat password<br /><span className="text-signal">pribadimu.</span></>} lede="Password awal hanya digunakan untuk masuk pertama kali. Buat password yang hanya kamu ketahui." noteIcon={KeyRound} note="Kamu harus menyelesaikan langkah ini sebelum mengakses sistem." formKicker="LOGIN PERTAMA" title="Ganti password awal" subtitle="Gunakan minimal 8 karakter untuk menjaga keamanan akunmu."><ChangePasswordForm /></AuthShell>;
}
