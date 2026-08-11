"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { activateStudent, addResident, addSecurityStaff, createPermit, resetStudentPassword, updateResident, updateSecurityStaff, validatePermit, verifyCredentials } from "@/lib/db";
import { clearSession, createSession, requireRole, roleHome } from "@/lib/auth";

export type FormState = { error?: string; success?: string };

export async function loginAction(_: FormState, formData: FormData): Promise<FormState> {
  const bcaId = String(formData.get("bcaId") || "");
  const password = String(formData.get("password") || "");
  if (!bcaId || !password) return { error: "Masukkan ID BCA dan password." };
  const account = verifyCredentials(bcaId, password);
  if (!account) return { error: "ID BCA atau password tidak tepat." };
  await createSession({ accountId: account.id, bcaId: account.bcaId, name: account.name, role: account.role, room: account.room });
  redirect(roleHome(account.role));
}

export async function activateAction(_: FormState, formData: FormData): Promise<FormState> {
  const password = String(formData.get("password") || "");
  if (password.length < 8) return { error: "Password minimal terdiri dari 8 karakter." };
  const result = activateStudent({
    bcaId: String(formData.get("bcaId") || ""),
    fullName: String(formData.get("fullName") || ""),
    room: String(formData.get("room") || ""),
    password,
  });
  return result.ok ? { success: result.message } : { error: result.message };
}

export async function logoutAction() {
  await clearSession();
  redirect("/");
}

export async function createPermitAction(_: FormState, formData: FormData): Promise<FormState> {
  const session = await requireRole("STUDENT");
  const destination = String(formData.get("destination") || "");
  const departure = String(formData.get("departure") || "");
  const returnAt = String(formData.get("returnAt") || "");
  if (!destination || !departure || !returnAt) return { error: "Lengkapi tujuan dan rencana waktu izin." };
  if (new Date(returnAt) <= new Date(departure)) return { error: "Waktu kembali harus setelah waktu keluar." };
  try {
    createPermit(session.accountId, { destination, departure, returnAt });
    revalidatePath("/student");
    revalidatePath("/student/apply");
    revalidatePath("/student/permit");
    revalidatePath("/student/history");
    return { success: "Izin dibuat. QR siap ditunjukkan kepada satpam." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Izin tidak dapat dibuat." };
  }
}

export async function validatePermitAction(_: FormState, formData: FormData): Promise<FormState> {
  const session = await requireRole("SECURITY");
  const permitId = Number(formData.get("permitId"));
  const event = String(formData.get("event")) as "EXIT" | "ENTRY";
  if (!permitId || !["EXIT", "ENTRY"].includes(event)) return { error: "Data validasi tidak lengkap." };
  const result = validatePermit(session.accountId, permitId, event);
  if (result.ok) {
    revalidatePath("/security");
    revalidatePath("/security/outside");
    revalidatePath("/manager");
    revalidatePath("/manager/stats");
    revalidatePath("/student");
    revalidatePath("/student/permit");
    revalidatePath("/student/history");
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
  };
  if (Object.values(values).some((value) => !value.trim())) return { error: "Semua data penghuni wajib diisi." };
  const result = addResident(session.accountId, values);
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
    residentStatus: String(formData.get("residentStatus") || "ACTIVE") as "ACTIVE" | "INACTIVE",
  };
  if (!id || !values.fullName.trim() || !values.room.trim() || !values.className.trim()) return { error: "Lengkapi data penghuni terlebih dahulu." };
  const result = updateResident(session.accountId, values);
  if (result.ok) {
    revalidatePath("/manager/users");
    revalidatePath("/manager/stats");
    revalidatePath("/manager");
  }
  return result.ok ? { success: result.message } : { error: result.message };
}

export async function resetPasswordAction(_: FormState, formData: FormData): Promise<FormState> {
  const password = String(formData.get("password") || "");
  if (password.length < 8) return { error: "Password minimal terdiri dari 8 karakter." };
  const result = resetStudentPassword({
    bcaId: String(formData.get("bcaId") || ""),
    fullName: String(formData.get("fullName") || ""),
    room: String(formData.get("room") || ""),
    password,
  });
  return result.ok ? { success: result.message } : { error: result.message };
}

export async function addSecurityStaffAction(_: FormState, formData: FormData): Promise<FormState> {
  const session = await requireRole("MANAGER");
  const values = { bcaId: String(formData.get("bcaId") || ""), fullName: String(formData.get("fullName") || ""), shiftLabel: String(formData.get("shiftLabel") || ""), password: String(formData.get("password") || "") };
  if (Object.values(values).some((value) => !value.trim()) || values.password.length < 8) return { error: "Lengkapi data satpam dan gunakan password minimal 8 karakter." };
  const result = addSecurityStaff(session.accountId, values);
  if (result.ok) revalidatePath("/manager/users");
  return result.ok ? { success: result.message } : { error: result.message };
}

export async function updateSecurityStaffAction(_: FormState, formData: FormData): Promise<FormState> {
  const session = await requireRole("MANAGER");
  const values = { id: Number(formData.get("id")), fullName: String(formData.get("fullName") || ""), shiftLabel: String(formData.get("shiftLabel") || ""), staffStatus: String(formData.get("staffStatus") || "ACTIVE") as "ACTIVE" | "INACTIVE" };
  if (!values.id || !values.fullName.trim() || !values.shiftLabel.trim()) return { error: "Lengkapi data satpam terlebih dahulu." };
  const result = updateSecurityStaff(session.accountId, values);
  if (result.ok) revalidatePath("/manager/users");
  return result.ok ? { success: result.message } : { error: result.message };
}
