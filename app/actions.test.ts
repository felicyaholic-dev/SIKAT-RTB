import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import bcrypt from "bcryptjs";
import Database from "better-sqlite3";
import { afterAll, describe, expect, it, vi } from "vitest";
import type { Session } from "@/lib/auth";

// Server actions call requireSession/requireRole (which read the request's
// cookies via next/headers) and redirect()/revalidatePath() (which need a
// live Next.js request context) — none of that exists under plain Vitest.
// Mocking @/lib/auth's auth checks directly (instead of faking cookies/JWTs)
// keeps this test focused on what actually matters here: the role/
// mustChangePassword branching inside changePasswordAction itself, not
// Next's request plumbing (already exercised in production and by the
// earlier manual smoke tests across STUDENT/SECURITY/MANAGER × true/false).
let currentSession: Session;

vi.mock("@/lib/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth")>();
  return {
    ...actual,
    requireSession: vi.fn(async () => currentSession),
    requireRole: vi.fn(async (...roles: string[]) => {
      if (!roles.includes(currentSession.role)) throw new Error(`role ${currentSession.role} not in ${roles.join(",")}`);
      return currentSession;
    }),
    createSession: vi.fn(async (session: Session) => { currentSession = session; }),
    getSession: vi.fn(async () => currentSession ?? null),
    clearSession: vi.fn(async () => {}),
  };
});

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => { throw new Error(`REDIRECT:${url}`); }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const testDir = fs.mkdtempSync(path.join(os.tmpdir(), "sikat-actions-test-"));
const dbPath = path.join(testDir, "sikat.db");

// Set synchronously, before any dynamic import below — lib/auth.ts throws
// at module-evaluation time if SESSION_SECRET is missing, and that
// evaluation happens the moment app/actions.ts (which imports it) is first
// imported, not deferred until beforeAll's callback actually runs.
process.env.DATABASE_URL = `file:${dbPath}`;
process.env.SESSION_SECRET = "vitest-only-secret-never-used-for-a-real-session-1234567890";

afterAll(() => {
  try { fs.rmSync(testDir, { recursive: true, force: true }); } catch { /* Windows file lock — see lib/db.test.ts */ }
});

const db = await import("@/lib/db");
const { changePasswordAction, logoutAction } = await import("@/app/actions");
const { RESIDENT_CLASSES } = await import("@/lib/ui");

function seedAccount(bcaId: string, role: "STUDENT" | "SECURITY" | "MANAGER", password: string, room = "A1-101"): number {
  if (role === "STUDENT") {
    db.addResident(1, { bcaId, fullName: "Test Account", room, className: RESIDENT_CLASSES[0], gender: "PEREMPUAN", password });
  } else {
    const raw = new Database(dbPath);
    raw.prepare("INSERT INTO accounts (bca_id, full_name, role, password_hash) VALUES (?, ?, ?, ?)")
      .run(bcaId, "Test Account", role, bcrypt.hashSync(password, 12));
    raw.close();
  }
  const raw = new Database(dbPath);
  const id = (raw.prepare("SELECT id FROM accounts WHERE bca_id = ?").get(bcaId) as { id: number }).id;
  raw.close();
  return id;
}

function formData(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.set(key, value);
  return fd;
}

describe("changePasswordAction — first-login-only for Mahasiswa/Satpam, anytime for Pengelola", () => {
  it("STUDENT with mustChangePassword=true (first login) can change their password, then redirects home", async () => {
    const accountId = seedAccount("500001", "STUDENT", "originalpass1");
    currentSession = { accountId, bcaId: "500001", name: "Test", role: "STUDENT", mustChangePassword: true };
    // The forced first-login path redirects afterward (redirect() throws in
    // real Next.js too, caught by the framework — mocked here to throw so we
    // can assert it was actually called, with the right destination).
    await expect(changePasswordAction({}, formData({ currentPassword: "originalpass1", password: "newpassword123", confirmPassword: "newpassword123" })))
      .rejects.toThrow("REDIRECT:/student");
    // The password itself was genuinely updated before the redirect fired.
    expect(db.changePassword(accountId, { currentPassword: "newpassword123", password: "irrelevant12" }).ok).toBe(true);
  });

  it("STUDENT with mustChangePassword=false (already past first login) is rejected outright", async () => {
    const accountId = seedAccount("500002", "STUDENT", "originalpass1");
    currentSession = { accountId, bcaId: "500002", name: "Test", role: "STUDENT", mustChangePassword: false };
    const result = await changePasswordAction({}, formData({ currentPassword: "originalpass1", password: "newpassword123", confirmPassword: "newpassword123" }));
    expect(result.error).toMatch(/hanya bisa mengganti password saat login pertama/i);
    expect(result.success).toBeUndefined();
    // Confirm the password genuinely did not change.
    expect(db.changePassword(accountId, { currentPassword: "originalpass1", password: "irrelevant12" }).ok).toBe(true);
  });

  it("SECURITY with mustChangePassword=false is rejected outright, same as STUDENT", async () => {
    const accountId = seedAccount("500003", "SECURITY", "originalpass1");
    currentSession = { accountId, bcaId: "500003", name: "Test", role: "SECURITY", mustChangePassword: false };
    const result = await changePasswordAction({}, formData({ currentPassword: "originalpass1", password: "newpassword123", confirmPassword: "newpassword123" }));
    expect(result.error).toMatch(/hanya bisa mengganti password saat login pertama/i);
  });

  it("MANAGER can change their password even when mustChangePassword=false (voluntary, anytime)", async () => {
    const accountId = seedAccount("500004", "MANAGER", "originalpass1");
    currentSession = { accountId, bcaId: "500004", name: "Test", role: "MANAGER", mustChangePassword: false };
    const result = await changePasswordAction({}, formData({ currentPassword: "originalpass1", password: "newpassword123", confirmPassword: "newpassword123" }));
    expect(result.success).toBeTruthy();
    expect(result.error).toBeUndefined();
  });

  it("MANAGER can also change their password during their own first login (also redirects, same as any role's forced flow)", async () => {
    const accountId = seedAccount("500005", "MANAGER", "originalpass1");
    currentSession = { accountId, bcaId: "500005", name: "Test", role: "MANAGER", mustChangePassword: true };
    await expect(changePasswordAction({}, formData({ currentPassword: "originalpass1", password: "newpassword123", confirmPassword: "newpassword123" })))
      .rejects.toThrow("REDIRECT:/manager");
    expect(db.changePassword(accountId, { currentPassword: "newpassword123", password: "irrelevant12" }).ok).toBe(true);
  });

  it("rejects a mismatched confirmation even when the role/state would otherwise be allowed", async () => {
    const accountId = seedAccount("500006", "MANAGER", "originalpass1");
    currentSession = { accountId, bcaId: "500006", name: "Test", role: "MANAGER", mustChangePassword: false };
    const result = await changePasswordAction({}, formData({ currentPassword: "originalpass1", password: "newpassword123", confirmPassword: "doesnotmatch" }));
    expect(result.error).toMatch(/konfirmasi/i);
  });

  it("rejects the wrong current password even when the role/state would otherwise be allowed", async () => {
    const accountId = seedAccount("500007", "MANAGER", "originalpass1");
    currentSession = { accountId, bcaId: "500007", name: "Test", role: "MANAGER", mustChangePassword: false };
    const result = await changePasswordAction({}, formData({ currentPassword: "not-the-password", password: "newpassword123", confirmPassword: "newpassword123" }));
    expect(result.error).toBeTruthy();
    expect(result.success).toBeUndefined();
  });
});

describe("logoutAction — abandons a pending permit instead of leaving it resumable forever", () => {
  it("cancels a STUDENT's pending (not yet validated) permit on logout, so the next login starts a fresh Ajukan Izin", async () => {
    const accountId = seedAccount("500008", "STUDENT", "originalpass1", "A1-102");
    db.createPermit(accountId, { destination: "Pulang", permitType: "IZIN_PRIBADI", departure: "2026-01-01T10:00" });
    expect(db.getStudentData(accountId)?.activePermit?.status).toBe("MENUNGGU_KELUAR");

    currentSession = { accountId, bcaId: "500008", name: "Test", role: "STUDENT", mustChangePassword: false };
    await expect(logoutAction()).rejects.toThrow("REDIRECT:/");

    expect(db.getStudentData(accountId)?.activePermit).toBeUndefined();
  });

  it("leaves a SEDANG_DI_LUAR status alone — that's the mahasiswa's real-world status, not something logging out should undo", async () => {
    const accountId = seedAccount("500009", "STUDENT", "originalpass1", "A1-102");
    db.createPermit(accountId, { destination: "Pulang", permitType: "IZIN_PRIBADI", departure: "2026-01-01T10:00" });
    const pending = db.getStudentData(accountId)!.activePermit!;
    const found = db.getPermitForSecurity(db.currentPermitCode(pending)!)!;
    db.decidePermit(1, found.id, "APPROVE");

    currentSession = { accountId, bcaId: "500009", name: "Test", role: "STUDENT", mustChangePassword: false };
    await expect(logoutAction()).rejects.toThrow("REDIRECT:/");

    expect(db.getStudentData(accountId)?.activePermit?.status).toBe("SEDANG_DI_LUAR");
  });

  it("does nothing to permits for non-STUDENT roles (satpam/pengelola have none to clean up)", async () => {
    const accountId = seedAccount("500010", "SECURITY", "originalpass1");
    currentSession = { accountId, bcaId: "500010", name: "Test", role: "SECURITY", mustChangePassword: false };
    await expect(logoutAction()).rejects.toThrow("REDIRECT:/");
    // No throw beyond the redirect is the assertion here — nothing STUDENT-specific runs for other roles.
  });
});
