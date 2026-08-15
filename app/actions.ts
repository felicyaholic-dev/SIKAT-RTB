"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addResident, addSecurityStaff, cancelPendingPermit, changePassword, clearAttempts, createBroadcast, createPermit, decidePermit, deleteBroadcast, isRateLimited, recordFailedAttempt, resetStudentPassword, updateManagerProfile, updateResident, updateSecurityStaff, verifyCredentials, type Gender } from "@/lib/db";
import { clearSession, createSession, requireRole, requireSession, roleHome } from "@/lib/auth";
import { RESIDENT_CLASSES } from "@/lib/ui";
import { sendWhatsAppBroadcast, sendWhatsAppMessage } from "@/lib/whatsapp";

export type FormState = { error?: string; success?: string };

export async function loginAction(_: FormState, formData: FormData): Promise<FormState> {
  const bcaId = String(formData.get("bcaId") || "");
  const password = String(formData.get("password") || "");
  if (!bcaId || !password) return { error: "Masukkan ID BCA dan password." };
  if (isRateLimited(bcaId, "LOGIN")) return { error: "Terlalu banyak percobaan masuk. Coba lagi dalam beberapa menit." };
  const account = verifyCredentials(bcaId, password);
  if (!account) {
    recordFailedAttempt(bcaId, "LOGIN");
    return { error: "ID BCA atau password tidak tepat." };
  }
  clearAttempts(bcaId, "LOGIN");
  await createSession({ accountId: account.id, bcaId: account.bcaId, name: account.name, role: account.role, room: account.room, mustChangePassword: account.mustChangePassword });
  redirect(account.mustChangePassword ? "/change-password" : roleHome(account.role));
}

export async function logoutAction() {
  await clearSession();
  redirect("/");
}

export async function createPermitAction(_: FormState, formData: FormData): Promise<FormState> {
  const session = await requireRole("STUDENT");
  const destination = String(formData.get("destination") || "");
  const permitType = String(formData.get("permitType") || "");
  const date = String(formData.get("date") || "");
  const time = String(formData.get("time") || "");
  const movementAt = date && time ? `${date}T${time}` : "";
  try {
    const result = createPermit(session.accountId, { destination, permitType, departure: movementAt, returnAt: movementAt });
    revalidatePath("/student");
    revalidatePath("/student/apply");
    revalidatePath("/student/permit");
    revalidatePath("/student/history");
    return { success: result.mode === "EXIT" ? "QR keluar berhasil dibuat. Tunjukkan kepada satpam." : "QR masuk berhasil dibuat. Tunjukkan kepada satpam." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Izin tidak dapat dibuat." };
  }
}

export async function cancelPendingPermitAction(_: FormState, formData: FormData): Promise<FormState> {
  const session = await requireRole("STUDENT");
  const permitId = Number(formData.get("permitId"));
  if (!permitId) return { error: "Data QR tidak valid." };
  const result = cancelPendingPermit(session.accountId, permitId);
  if (result.ok) {
    revalidatePath("/student");
    revalidatePath("/student/apply");
    revalidatePath("/student/permit");
    revalidatePath("/student/history");
    revalidatePath("/manager");
    revalidatePath("/manager/stats");
  }
  return result.ok ? { success: result.message } : { error: result.message };
}

export async function validatePermitAction(_: FormState, formData: FormData): Promise<FormState> {
  const session = await requireRole("SECURITY");
  const permitId = Number(formData.get("permitId"));
  const decision = String(formData.get("decision") || "") as "APPROVE" | "REJECT";
  if (!permitId) return { error: "Data validasi tidak lengkap." };
  if (!["APPROVE", "REJECT"].includes(decision)) return { error: "Pilih keputusan izin terlebih dahulu." };
  const result = decidePermit(session.accountId, permitId, decision);
  // Do not revalidate while this action is open: the satpam needs to see the
  // animated confirmation before its modal is allowed to close. The next
  // navigation reads the new database state, while the student's QR page
  // receives the result through its short polling endpoint.
  if (result.ok) {
    if (result.resident) {
      const text = result.event === "EXIT"
        ? `Halo ${result.resident.full_name}, izin keluar RTB kamu sudah disetujui satpam. Selamat beraktivitas, jangan lupa buat QR masuk di SIKAT RTB saat kembali ya.`
        : result.event === "EXIT_REJECTED"
        ? `Halo ${result.resident.full_name}, pengajuan izin keluar RTB kamu ditolak satpam di gerbang. Kamu tetap tercatat berada di dalam RTB — silakan hubungi satpam untuk info lebih lanjut.`
        : `Halo ${result.resident.full_name}, kamu sudah tercatat kembali masuk RTB. Terima kasih sudah lapor tepat waktu lewat SIKAT RTB.`;
      void sendWhatsAppMessage(result.resident.phone_number, text);
    }
    return { success: result.message };
  }
  return { error: result.message };
}

export async function addResidentAction(_: FormState, formData: FormData): Promise<FormState> {
  const session = await requireRole("MANAGER");
  const values = {
    bcaId: String(formData.get("bcaId") || ""),
    fullName: String(formData.get("fullName") || ""),
    room: String(formData.get("room") || ""),
    className: String(formData.get("className") || ""),
    gender: String(formData.get("gender") || "") as Gender,
    password: String(formData.get("password") || ""),
  };
  const phoneNumber = String(formData.get("phoneNumber") || "");
  if (Object.values(values).some((value) => !value.trim()) || !["LAKI_LAKI", "PEREMPUAN"].includes(values.gender) || values.password.length < 8) return { error: "Lengkapi data penghuni, jenis kelamin, dan password awal minimal 8 karakter." };
  if (!(RESIDENT_CLASSES as readonly string[]).includes(values.className)) return { error: "Pilih kelas dari daftar yang tersedia." };
  const result = addResident(session.accountId, { ...values, phoneNumber });
  if (result.ok) {
    revalidatePath("/manager/users");
    revalidatePath("/manager/stats");
    revalidatePath("/manager");
  }
  return result.ok ? { success: result.message } : { error: result.message };
}

export async function updateResidentAction(_: FormState, formData: FormData): Promise<FormState> {
  const session = await requireRole("MANAGER");
  const id = Number(formData.get("id"));
  const values = {
    id,
    fullName: String(formData.get("fullName") || ""),
    room: String(formData.get("room") || ""),
    className: String(formData.get("className") || ""),
    gender: String(formData.get("gender") || "") as Gender,
    residentStatus: String(formData.get("residentStatus") || "ACTIVE") as "ACTIVE" | "INACTIVE",
  };
  const phoneNumber = String(formData.get("phoneNumber") || "");
  if (!id || !values.fullName.trim() || !values.room.trim() || !values.className.trim() || !["LAKI_LAKI", "PEREMPUAN"].includes(values.gender)) return { error: "Lengkapi data penghuni dan jenis kelamin terlebih dahulu." };
  const result = updateResident(session.accountId, { ...values, phoneNumber });
  if (result.ok) {
    revalidatePath("/manager/users");
    revalidatePath("/manager/stats");
    revalidatePath("/manager");
  }
  return result.ok ? { success: result.message } : { error: result.message };
}

export async function resetPasswordAction(_: FormState, formData: FormData): Promise<FormState> {
  const bcaId = String(formData.get("bcaId") || "");
  const password = String(formData.get("password") || "");
  if (password.length < 8) return { error: "Password minimal terdiri dari 8 karakter." };
  if (isRateLimited(bcaId, "RESET_PASSWORD")) return { error: "Terlalu banyak percobaan reset. Coba lagi dalam beberapa menit." };
  const result = resetStudentPassword({
    bcaId,
    fullName: String(formData.get("fullName") || ""),
    room: String(formData.get("room") || ""),
    password,
  });
  if (result.ok) clearAttempts(bcaId, "RESET_PASSWORD");
  else recordFailedAttempt(bcaId, "RESET_PASSWORD");
  return result.ok ? { success: result.message } : { error: result.message };
}

export async function changePasswordAction(_: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession();
  const currentPassword = String(formData.get("currentPassword") || "");
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");
  if (password.length < 8) return { error: "Password baru minimal terdiri dari 8 karakter." };
  if (password !== confirmPassword) return { error: "Konfirmasi password belum sama." };
  const result = changePassword(session.accountId, { currentPassword, password });
  if (!result.ok) return { error: result.message };
  await createSession({ ...session, mustChangePassword: false });
  redirect(roleHome(session.role));
}

export async function addSecurityStaffAction(_: FormState, formData: FormData): Promise<FormState> {
  const session = await requireRole("MANAGER");
  const values = { bcaId: String(formData.get("bcaId") || ""), fullName: String(formData.get("fullName") || ""), gender: String(formData.get("gender") || "") as Gender, password: String(formData.get("password") || "") };
  if (Object.values(values).some((value) => !value.trim()) || !["LAKI_LAKI", "PEREMPUAN"].includes(values.gender) || values.password.length < 8) return { error: "Lengkapi data satpam, jenis kelamin, dan password minimal 8 karakter." };
  if (!/^\d{5}$/.test(values.bcaId.trim())) return { error: "ID satpam harus terdiri dari tepat 5 angka." };
  const result = addSecurityStaff(session.accountId, values);
  if (result.ok) revalidatePath("/manager/users");
  return result.ok ? { success: result.message } : { error: result.message };
}

export async function updateSecurityStaffAction(_: FormState, formData: FormData): Promise<FormState> {
  const session = await requireRole("MANAGER");
  const values = { id: Number(formData.get("id")), fullName: String(formData.get("fullName") || ""), gender: String(formData.get("gender") || "") as Gender, staffStatus: String(formData.get("staffStatus") || "ACTIVE") as "ACTIVE" | "INACTIVE" };
  if (!values.id || !values.fullName.trim() || !["LAKI_LAKI", "PEREMPUAN"].includes(values.gender)) return { error: "Lengkapi data satpam dan jenis kelamin terlebih dahulu." };
  const result = updateSecurityStaff(session.accountId, values);
  if (result.ok) revalidatePath("/manager/users");
  return result.ok ? { success: result.message } : { error: result.message };
}

export async function updateManagerProfileAction(_: FormState, formData: FormData): Promise<FormState> {
  const session = await requireRole("MANAGER");
  const result = updateManagerProfile(session.accountId, {
    bcaId: String(formData.get("bcaId") || ""),
    fullName: String(formData.get("fullName") || ""),
  });
  if (!result.ok) return { error: result.message };
  await createSession({ ...session, bcaId: result.bcaId ?? session.bcaId, name: result.fullName ?? session.name });
  revalidatePath("/manager");
  revalidatePath("/manager/profile");
  revalidatePath("/manager/users");
  revalidatePath("/manager/stats");
  return { success: result.message };
}

export async function createBroadcastAction(_: FormState, formData: FormData): Promise<FormState> {
  const session = await requireRole("MANAGER");
  const result = createBroadcast(session.accountId, {
    title: String(formData.get("title") || ""),
    body: String(formData.get("body") || ""),
  });
  if (result.ok) {
    revalidatePath("/manager/users");
    revalidatePath("/manager");
    if (result.recipients?.length) {
      void sendWhatsAppBroadcast(result.recipients, (fullName) => `Halo ${fullName}, ada pengumuman baru di SIKAT RTB. Silakan buka aplikasi untuk melihat detailnya.`);
    }
  }
  return result.ok ? { success: result.message } : { error: result.message };
}

export async function deleteBroadcastAction(_: FormState, formData: FormData): Promise<FormState> {
  const session = await requireRole("MANAGER");
  const notificationId = Number(formData.get("notificationId"));
  if (!notificationId) return { error: "Notifikasi tidak valid." };
  const result = deleteBroadcast(session.accountId, notificationId);
  if (result.ok) {
    revalidatePath("/manager/users");
    revalidatePath("/manager");
  }
  return result.ok ? { success: result.message } : { error: result.message };
}
