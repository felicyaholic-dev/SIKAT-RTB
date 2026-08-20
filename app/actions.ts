"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addResident, addSecurityStaff, cancelPendingPermit, changePassword, clearAttempts, createBroadcast, createPermit, decidePermit, deleteBroadcast, deleteResident, deleteResidentsByClass, deleteSecurityStaff, getStudentData, importResidents, isRateLimited, recordFailedAttempt, requestManagerPasswordReset, resetHistory, resetManagerPasswordWithToken, updateManagerProfile, updateOwnContactInfo, updateResident, updateSecurityStaff, verifyCredentials, type Gender } from "@/lib/db";
import { clearSession, createSession, getClientIp, getSession, requireRole, requireSession, roleHome } from "@/lib/auth";
import { parseResidentSheet } from "@/lib/excel-import";
import { formatJakartaInput, RESIDENT_CLASSES } from "@/lib/ui";
import { sendPermitEntryConfirmed, sendPermitExitApproved, sendPermitExitRejected, sendWhatsAppBroadcast } from "@/lib/whatsapp";
import { sendEmailBroadcast, sendManagerPasswordResetEmail, sendPasswordChangedEmail, sendPermitEntryConfirmedEmail, sendPermitExitApprovedEmail, sendPermitExitRejectedEmail } from "@/lib/email";

export type FormState = { error?: string; success?: string; detail?: string[] };

function formatWaktu(value: string) {
  return formatJakartaInput(value, { dateStyle: "long", timeStyle: "short" });
}

export async function loginAction(_: FormState, formData: FormData): Promise<FormState> {
  const bcaId = String(formData.get("bcaId") || "");
  const password = String(formData.get("password") || "");
  if (!bcaId || !password) return { error: "Masukkan ID BCA dan password." };
  const ip = await getClientIp();
  // Two dimensions: per-bcaId (catches repeated guesses against one account)
  // and per-IP (catches one source spraying many different bcaId values —
  // per-bcaId alone never sees that pattern since each account only gets a
  // few tries). See RATE_LIMITS in lib/db.ts for the thresholds and the
  // shared-dorm-WiFi tradeoff of the IP dimension.
  if (isRateLimited(bcaId, "LOGIN") || isRateLimited(ip, "LOGIN_IP")) return { error: "Terlalu banyak percobaan masuk. Coba lagi dalam beberapa menit." };
  const account = verifyCredentials(bcaId, password);
  if (!account) {
    recordFailedAttempt(bcaId, "LOGIN");
    recordFailedAttempt(ip, "LOGIN_IP");
    return { error: "ID BCA atau password tidak tepat." };
  }
  clearAttempts(bcaId, "LOGIN");
  await createSession({ accountId: account.id, bcaId: account.bcaId, name: account.name, role: account.role, room: account.room, mustChangePassword: account.mustChangePassword });
  redirect(account.mustChangePassword ? "/change-password" : roleHome(account.role));
}

export async function logoutAction() {
  // A pending (not-yet-validated) QR/kode is tied to this browser session —
  // logging out abandons it rather than leaving it sitting around forever
  // now that there's no hard time expiry (it rotates every 15s instead, see
  // currentPermitCode in lib/db.ts). Next login starts a fresh Ajukan Izin,
  // not a resumed one. Doesn't touch SEDANG_DI_LUAR — that's the mahasiswa's
  // actual real-world status, unrelated to whether they're logged in.
  const session = await getSession();
  if (session?.role === "STUDENT") {
    const pending = getStudentData(session.accountId)?.activePermit;
    if (pending && (pending.status === "MENUNGGU_KELUAR" || pending.status === "MENUNGGU_MASUK")) {
      cancelPendingPermit(session.accountId, pending.id);
    }
  }
  await clearSession();
  redirect("/");
}

export async function createPermitAction(_: FormState, formData: FormData): Promise<FormState> {
  const session = await requireRole("STUDENT");
  const destination = String(formData.get("destination") || "");
  const permitType = String(formData.get("permitType") || "");
  const time = String(formData.get("time") || "");
  // Izin keluar/masuk selalu untuk hari ini — tanggal dihitung di server
  // (zona Jakarta), bukan dipercaya dari form, supaya mahasiswa tidak bisa
  // mengajukan untuk tanggal kemarin/besok lewat request yang dimanipulasi.
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
  const movementAt = time ? `${date}T${time}` : "";
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

export async function updateOwnContactAction(_: FormState, formData: FormData): Promise<FormState> {
  const session = await requireRole("STUDENT");
  const room = String(formData.get("room") || "");
  const phoneNumber = String(formData.get("phoneNumber") || "");
  const email = String(formData.get("email") || "");
  const result = updateOwnContactInfo(session.accountId, { room, phoneNumber, email });
  if (result.ok) {
    revalidatePath("/student/profile");
    revalidatePath("/manager/users");
  }
  return result.ok ? { success: result.message } : { error: result.message };
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
    if (result.resident && result.notif) {
      const { full_name, phone_number, email } = result.resident;
      const { permitCode, entryCode, destination, departureAt, returnAt } = result.notif;
      if (result.event === "EXIT") {
        void sendPermitExitApproved(phone_number, full_name, permitCode, destination, formatWaktu(departureAt));
        void sendPermitExitApprovedEmail(email, full_name, permitCode, destination, formatWaktu(departureAt));
      } else if (result.event === "EXIT_REJECTED") {
        void sendPermitExitRejected(phone_number, full_name, permitCode, destination);
        void sendPermitExitRejectedEmail(email, full_name, permitCode, destination);
      } else {
        void sendPermitEntryConfirmed(phone_number, full_name, entryCode ?? "-", formatWaktu(returnAt));
        void sendPermitEntryConfirmedEmail(email, full_name, entryCode ?? "-", formatWaktu(returnAt));
      }
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
  const email = String(formData.get("email") || "");
  if (Object.values(values).some((value) => !value.trim()) || !["LAKI_LAKI", "PEREMPUAN"].includes(values.gender) || values.password.length < 8) return { error: "Lengkapi data penghuni, jenis kelamin, dan password awal minimal 8 karakter." };
  if (!(RESIDENT_CLASSES as readonly string[]).includes(values.className)) return { error: "Pilih kelas dari daftar yang tersedia." };
  const result = addResident(session.accountId, { ...values, phoneNumber, email });
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
  const email = String(formData.get("email") || "");
  if (!id || !values.fullName.trim() || !values.room.trim() || !values.className.trim() || !["LAKI_LAKI", "PEREMPUAN"].includes(values.gender)) return { error: "Lengkapi data penghuni dan jenis kelamin terlebih dahulu." };
  const result = updateResident(session.accountId, { ...values, phoneNumber, email });
  if (result.ok) {
    revalidatePath("/manager/users");
    revalidatePath("/manager/stats");
    revalidatePath("/manager");
  }
  return result.ok ? { success: result.message } : { error: result.message };
}

// Always records an attempt (not just failures) and always returns the same
// generic message via requestManagerPasswordReset — an attacker probing BCA
// IDs must not be able to tell a real Pengelola account from a made-up one
// via either the rate-limit behavior or the response text.
export async function requestManagerPasswordResetAction(_: FormState, formData: FormData): Promise<FormState> {
  const bcaId = String(formData.get("bcaId") || "");
  if (!/^\d{6}$/.test(bcaId.trim())) return { error: "ID BCA harus terdiri dari 6 angka." };
  if (isRateLimited(bcaId, "RESET_PASSWORD")) return { error: "Terlalu banyak percobaan. Coba lagi dalam beberapa menit." };
  recordFailedAttempt(bcaId, "RESET_PASSWORD");
  const result = requestManagerPasswordReset(bcaId);
  if (result.email && result.token) {
    const resetUrl = `${(process.env.APP_URL || "").replace(/\/$/, "")}/reset-password/manager/confirm?token=${result.token}`;
    void sendManagerPasswordResetEmail(result.email, result.name ?? "", resetUrl);
  }
  return { success: result.message };
}

export async function confirmManagerPasswordResetAction(_: FormState, formData: FormData): Promise<FormState> {
  const token = String(formData.get("token") || "");
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");
  if (password !== confirmPassword) return { error: "Konfirmasi password belum sama." };
  const result = resetManagerPasswordWithToken(token, password);
  return result.ok ? { success: result.message } : { error: result.message };
}

// Mahasiswa & Satpam may only set their password once, during the forced
// first-login flow (mustChangePassword). Pengelola can change theirs anytime
// (this same action also powers the voluntary form on /manager/profile) —
// if they forget it later, only Pengelola can reset an account, so this
// keeps that recovery path from depending on itself.
export async function changePasswordAction(_: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession();
  if (session.role !== "MANAGER" && !session.mustChangePassword) {
    return { error: "Mahasiswa dan satpam hanya bisa mengganti password saat login pertama. Hubungi Pengelola RTB untuk reset password." };
  }
  const currentPassword = String(formData.get("currentPassword") || "");
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");
  if (password.length < 8) return { error: "Password baru minimal terdiri dari 8 karakter." };
  if (password !== confirmPassword) return { error: "Konfirmasi password belum sama." };
  const result = changePassword(session.accountId, { currentPassword, password });
  if (!result.ok) return { error: result.message };
  const wasForced = session.mustChangePassword;
  if (result.resident?.email) void sendPasswordChangedEmail(result.resident.email, result.resident.full_name);
  await createSession({ ...session, mustChangePassword: false });
  if (wasForced) redirect(roleHome(session.role));
  return { success: "Password berhasil diperbarui." };
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
    email: String(formData.get("email") || ""),
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
  const body = String(formData.get("body") || "");
  const result = createBroadcast(session.accountId, {
    title: String(formData.get("title") || ""),
    body,
  });
  if (result.ok) {
    revalidatePath("/manager/users");
    revalidatePath("/manager");
    if (result.recipients?.length) {
      void sendWhatsAppBroadcast(result.recipients, result.title);
      void sendEmailBroadcast(result.recipients, result.title, body);
    }
  }
  return result.ok ? { success: result.message } : { error: result.message };
}

export async function deleteResidentAction(_: FormState, formData: FormData): Promise<FormState> {
  const session = await requireRole("MANAGER");
  const id = Number(formData.get("id"));
  if (!id) return { error: "Data penghuni tidak valid." };
  const result = deleteResident(session.accountId, id);
  if (result.ok) {
    revalidatePath("/manager/users");
    revalidatePath("/manager/stats");
    revalidatePath("/manager");
  }
  return result.ok ? { success: result.message } : { error: result.message };
}

export async function deleteResidentsByClassAction(_: FormState, formData: FormData): Promise<FormState> {
  const session = await requireRole("MANAGER");
  const className = String(formData.get("className") || "");
  if (!(RESIDENT_CLASSES as readonly string[]).includes(className)) return { error: "Pilih kelas yang valid." };
  const result = deleteResidentsByClass(session.accountId, className);
  if (result.ok) {
    revalidatePath("/manager/users");
    revalidatePath("/manager/stats");
    revalidatePath("/manager");
  }
  return result.ok ? { success: result.message } : { error: result.message };
}

export async function resetHistoryAction(_: FormState, formData: FormData): Promise<FormState> {
  const session = await requireRole("MANAGER");
  const scope = String(formData.get("scope") || "ALL");
  const className = String(formData.get("className") || "");
  if (scope === "CLASS" && !(RESIDENT_CLASSES as readonly string[]).includes(className)) return { error: "Pilih kelas yang valid." };
  const result = resetHistory(session.accountId, scope === "CLASS" ? className : undefined);
  revalidatePath("/manager/stats");
  revalidatePath("/manager");
  return result.ok ? { success: result.message } : { error: result.message };
}

export async function importResidentsAction(_: FormState, formData: FormData): Promise<FormState> {
  const session = await requireRole("MANAGER");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Pilih file Excel (.xlsx) terlebih dahulu." };
  if (!file.name.toLowerCase().endsWith(".xlsx")) return { error: "File harus berformat .xlsx." };
  let rows: Awaited<ReturnType<typeof parseResidentSheet>>;
  try {
    rows = await parseResidentSheet(await file.arrayBuffer());
  } catch {
    return { error: "Gagal membaca file Excel. Pastikan formatnya sesuai template." };
  }
  if (!rows.length) return { error: "Tidak ada data ditemukan di file tersebut." };
  if (rows.length > 1000) return { error: "Maksimal 1000 baris per impor." };

  const result = importResidents(session.accountId, rows);
  if (result.successCount > 0) {
    revalidatePath("/manager/users");
    revalidatePath("/manager/stats");
    revalidatePath("/manager");
  }
  const failedLines = result.results.filter((r) => !r.ok).map((r) => `Baris ${r.row}: ${r.message}`);
  if (result.successCount === 0) return { error: `Semua ${result.failCount} baris gagal diimpor.`, detail: failedLines.slice(0, 20) };
  return {
    success: `${result.successCount} penghuni berhasil diimpor${result.failCount > 0 ? `, ${result.failCount} baris gagal` : ""}.`,
    detail: failedLines.length ? failedLines.slice(0, 20) : undefined,
  };
}

export async function deleteSecurityStaffAction(_: FormState, formData: FormData): Promise<FormState> {
  const session = await requireRole("MANAGER");
  const id = Number(formData.get("id"));
  if (!id) return { error: "Data satpam tidak valid." };
  const result = deleteSecurityStaff(session.accountId, id);
  if (result.ok) revalidatePath("/manager/users");
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
