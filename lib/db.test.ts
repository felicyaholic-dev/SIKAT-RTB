import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { RESIDENT_CLASSES } from "@/lib/ui";

// Each test file gets its own throwaway SQLite file so tests never touch
// the real data/sikat.db or collide with each other. getDb()/databasePath()
// read DATABASE_URL lazily (only when a db.* function is first called, not
// at import time), so setting it in beforeAll — after imports are resolved
// but before any test body runs — is enough, despite import hoisting.
const testDir = fs.mkdtempSync(path.join(os.tmpdir(), "sikat-db-test-"));
const dbPath = path.join(testDir, "sikat.db");

const MANAGER_ID = 999_001;

beforeAll(() => {
  process.env.DATABASE_URL = `file:${dbPath}`;
  // Trigger getDb() first so the real schema (all tables, ensureColumn
  // migrations) is created exactly as production would — only then insert
  // the manager row a raw connection needs for the FK on
  // permit_events.performed_by_account_id. Inserting via a pre-made
  // approximate schema would let getDb()'s own CREATE TABLE IF NOT EXISTS
  // silently skip the real accounts table definition.
  db.getAuditLog();
  const raw = new Database(dbPath);
  raw.prepare("INSERT INTO accounts (id, bca_id, full_name, role, password_hash) VALUES (?, ?, ?, 'MANAGER', ?)")
    .run(MANAGER_ID, "999001", "Test Manager Actor", "x");
  raw.close();
});

afterAll(() => {
  // Best-effort: the module-level db connection in lib/db.ts stays open for
  // the process lifetime (correct for a real server), so on Windows the
  // file can still be locked here — leftover files in os.tmpdir() are
  // harmless and get cleaned by the OS regardless.
  try { fs.rmSync(testDir, { recursive: true, force: true }); } catch { /* ignore */ }
});

const db = await import("@/lib/db");

describe("addResident — wing/gender validation", () => {
  it("rejects a resident whose gender doesn't match the room's wing", () => {
    const result = db.addResident(MANAGER_ID, { bcaId: "100001", fullName: "Salah Gender", room: "A1-101", className: RESIDENT_CLASSES[0], gender: "LAKI_LAKI", password: "password123" });
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/wing|khusus/i);
  });

  it("accepts a resident whose gender matches the room's wing", () => {
    const result = db.addResident(MANAGER_ID, { bcaId: "100002", fullName: "Benar Gender", room: "A1-102", className: RESIDENT_CLASSES[0], gender: "PEREMPUAN", password: "password123" });
    expect(result.ok).toBe(true);
  });

  it("rejects an unrecognized room/wing format", () => {
    const result = db.addResident(MANAGER_ID, { bcaId: "100003", fullName: "Kamar Aneh", room: "Z9-999", className: RESIDENT_CLASSES[0], gender: "PEREMPUAN", password: "password123" });
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/tidak dikenali/i);
  });

  it("rejects a third active resident in an already-full room (max 2)", () => {
    expect(db.addResident(MANAGER_ID, { bcaId: "100004", fullName: "Kamar Penuh A", room: "A2-201", className: RESIDENT_CLASSES[0], gender: "PEREMPUAN", password: "password123" }).ok).toBe(true);
    expect(db.addResident(MANAGER_ID, { bcaId: "100005", fullName: "Kamar Penuh B", room: "A2-201", className: RESIDENT_CLASSES[0], gender: "PEREMPUAN", password: "password123" }).ok).toBe(true);
    const third = db.addResident(MANAGER_ID, { bcaId: "100006", fullName: "Kamar Penuh C", room: "A2-201", className: RESIDENT_CLASSES[0], gender: "PEREMPUAN", password: "password123" });
    expect(third.ok).toBe(false);
    expect(third.message).toMatch(/penuh|maksimal/i);
  });

  it("rejects a duplicate ID BCA", () => {
    const dup = db.addResident(MANAGER_ID, { bcaId: "100002", fullName: "Duplikat", room: "B1-101", className: RESIDENT_CLASSES[0], gender: "PEREMPUAN", password: "password123" });
    expect(dup.ok).toBe(false);
  });
});

describe("permit lifecycle", () => {
  function residentAccountId(bcaId: string): number {
    const raw = new Database(dbPath);
    const row = raw.prepare("SELECT id FROM accounts WHERE bca_id = ?").get(bcaId) as { id: number };
    raw.close();
    return row.id;
  }

  // The code satpam actually validates rotates every 15s (currentPermitCode)
  // rather than being the fixed permit_code/entry_code label — this looks up
  // "whatever the mahasiswa's screen would show right now" the same way the
  // real /api/student/current-permit-code route does, and hands back that
  // code string too so a test can re-check it post-mutation: once a
  // permit's status moves off MENUNGGU_KELUAR/MENUNGGU_MASUK,
  // getPermitForSecurity's status filter alone drops it from the candidate
  // set regardless of what code is presented, no need to re-derive.
  function findByAccount(accountId: number) {
    const activePermit = db.getStudentData(accountId)!.activePermit!;
    const code = db.currentPermitCode(activePermit)!;
    return { found: db.getPermitForSecurity(code), code };
  }

  it("takes a permit from request through exit, entry request, and confirmed entry", () => {
    db.addResident(MANAGER_ID, { bcaId: "200001", fullName: "Alur Lengkap", room: "A3-101", className: RESIDENT_CLASSES[0], gender: "LAKI_LAKI", password: "password123" });
    const accountId = residentAccountId("200001");

    const created = db.createPermit(accountId, { destination: "Pulang", permitType: "IZIN_PRIBADI", departure: "2026-01-01T10:00" });
    expect(created.mode).toBe("EXIT");

    const { found } = findByAccount(accountId);
    expect(found?.full_name).toBe("Alur Lengkap");

    const approved = db.decidePermit(MANAGER_ID, found!.id, "APPROVE");
    expect(approved.ok).toBe(true);
    expect(approved.event).toBe("EXIT");

    // While SEDANG_DI_LUAR, createPermit always treats the call as an entry
    // request (not a second exit) — omitting returnAt is rejected outright.
    expect(() => db.createPermit(accountId, { destination: "Lagi", permitType: "IZIN_PRIBADI", departure: "2026-01-01T11:00" })).toThrow("Masukkan waktu kembali");
    const entryRequested = db.createPermit(accountId, { returnAt: "2026-01-01T18:00" });
    expect(entryRequested.mode).toBe("ENTRY");

    const { found: foundEntry } = findByAccount(accountId);
    expect(foundEntry?.status).toBe("MENUNGGU_MASUK");

    const confirmed = db.decidePermit(MANAGER_ID, foundEntry!.id, "APPROVE");
    expect(confirmed.ok).toBe(true);
    expect(confirmed.event).toBe("ENTRY");
  });

  it("rejects an exit request planned during curfew (22.00–04.59) but allows the boundary times", () => {
    db.addResident(MANAGER_ID, { bcaId: "200009", fullName: "Jam Malam", room: "A3-109", className: RESIDENT_CLASSES[0], gender: "LAKI_LAKI", password: "password123" });
    const accountId = residentAccountId("200009");

    expect(() => db.createPermit(accountId, { destination: "Malam", permitType: "IZIN_PRIBADI", departure: "2026-01-01T22:00" })).toThrow("jam malam");
    expect(() => db.createPermit(accountId, { destination: "Malam", permitType: "IZIN_PRIBADI", departure: "2026-01-01T02:30" })).toThrow("jam malam");

    const atFive = db.createPermit(accountId, { destination: "Subuh", permitType: "IZIN_PRIBADI", departure: "2026-01-01T05:00" });
    expect(atFive.mode).toBe("EXIT");
  });

  it("rejecting an exit request cancels it instead of sending the resident outside", () => {
    db.addResident(MANAGER_ID, { bcaId: "200002", fullName: "Ditolak Keluar", room: "A3-102", className: RESIDENT_CLASSES[0], gender: "LAKI_LAKI", password: "password123" });
    const accountId = residentAccountId("200002");
    db.createPermit(accountId, { destination: "Pulang", permitType: "IZIN_PRIBADI", departure: "2026-01-01T10:00" });
    const { found, code } = findByAccount(accountId);
    const rejected = db.decidePermit(MANAGER_ID, found!.id, "REJECT");
    expect(rejected.ok).toBe(true);
    expect(rejected.event).toBe("EXIT_REJECTED");
    // Now DIBATALKAN — no longer findable as an actionable permit for satpam.
    expect(db.getPermitForSecurity(code)).toBeUndefined();
  });

  it("cancelPendingPermit only lets the owning student cancel their own pending permit, not another student's", () => {
    db.addResident(MANAGER_ID, { bcaId: "200010", fullName: "Pemilik Izin", room: "A3-110", className: RESIDENT_CLASSES[0], gender: "LAKI_LAKI", password: "password123" });
    db.addResident(MANAGER_ID, { bcaId: "200011", fullName: "Mahasiswa Lain", room: "A3-111", className: RESIDENT_CLASSES[0], gender: "LAKI_LAKI", password: "password123" });
    const ownerAccountId = residentAccountId("200010");
    const otherAccountId = residentAccountId("200011");

    db.createPermit(ownerAccountId, { destination: "Pulang", permitType: "IZIN_PRIBADI", departure: "2026-01-01T10:00" });
    const { found, code } = findByAccount(ownerAccountId);

    const stolen = db.cancelPendingPermit(otherAccountId, found!.id);
    expect(stolen.ok).toBe(false);
    expect(db.getPermitForSecurity(code)).toBeDefined(); // untouched

    const cancelled = db.cancelPendingPermit(ownerAccountId, found!.id);
    expect(cancelled.ok).toBe(true);
    expect(db.getPermitForSecurity(code)).toBeUndefined();
  });

  it("cancelPendingPermit rejects a permit already processed by satpam", () => {
    db.addResident(MANAGER_ID, { bcaId: "200012", fullName: "Sudah Diproses", room: "A3-112", className: RESIDENT_CLASSES[0], gender: "LAKI_LAKI", password: "password123" });
    const accountId = residentAccountId("200012");
    db.createPermit(accountId, { destination: "Pulang", permitType: "IZIN_PRIBADI", departure: "2026-01-01T10:00" });
    const { found } = findByAccount(accountId);
    db.decidePermit(MANAGER_ID, found!.id, "APPROVE");

    expect(db.cancelPendingPermit(accountId, found!.id).ok).toBe(false);
  });

  it("decidePermit rejects a second decide on an already-decided permit — the guard against two satpam racing the same QR", () => {
    db.addResident(MANAGER_ID, { bcaId: "200013", fullName: "Dua Satpam", room: "A3-113", className: RESIDENT_CLASSES[0], gender: "LAKI_LAKI", password: "password123" });
    const accountId = residentAccountId("200013");
    db.createPermit(accountId, { destination: "Pulang", permitType: "IZIN_PRIBADI", departure: "2026-01-01T10:00" });
    const { found } = findByAccount(accountId);

    const first = db.decidePermit(MANAGER_ID, found!.id, "APPROVE");
    expect(first.ok).toBe(true);

    const second = db.decidePermit(MANAGER_ID, found!.id, "APPROVE");
    expect(second.ok).toBe(false);
    expect(second.message).toContain("Terjadi kesalahan");
  });

  it("the QR/kode shown to the mahasiswa rotates every 15s (anti-screenshot) and satpam's lookup follows it", () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-06-01T00:00:00.000Z"));
      db.addResident(MANAGER_ID, { bcaId: "200014", fullName: "Kode Berputar", room: "A3-114", className: RESIDENT_CLASSES[0], gender: "LAKI_LAKI", password: "password123" });
      const accountId = residentAccountId("200014");
      db.createPermit(accountId, { destination: "Pulang", permitType: "IZIN_PRIBADI", departure: "2026-01-01T10:00" });
      const activePermit = db.getStudentData(accountId)!.activePermit!;

      const codeNow = db.currentPermitCode(activePermit);
      expect(codeNow).toMatch(/^SKT-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
      // Satpam validating with exactly this code, right now, works.
      expect(db.getPermitForSecurity(codeNow!)?.id).toBe(activePermit.id);

      // 20s later — one 15s window has passed — the code is different...
      vi.setSystemTime(new Date(Date.now() + 20_000));
      const codeLater = db.currentPermitCode(activePermit);
      expect(codeLater).not.toBe(codeNow);
      // ...but a satpam still typing/scanning the previous code moments ago
      // isn't punished for that lag (±1 step tolerance).
      expect(db.getPermitForSecurity(codeNow!)?.id).toBe(activePermit.id);

      // Well outside that tolerance (a full minute on), the old code is dead.
      vi.setSystemTime(new Date(Date.now() + 60_000));
      expect(db.getPermitForSecurity(codeNow!)).toBeUndefined();
      // But the permit itself is untouched — there's no hard expiry anymore,
      // the current code (whatever it is right now) still validates fine.
      expect(db.getPermitForSecurity(db.currentPermitCode(activePermit)!)?.id).toBe(activePermit.id);
    } finally {
      vi.useRealTimers();
    }
  });

  it("getPermitForSecurity never matches a code that doesn't exactly exist — no partial/foreign-QR match", () => {
    expect(db.getPermitForSecurity("SOME-RANDOM-QR-FROM-ANOTHER-APP")).toBeUndefined();
    expect(db.getPermitForSecurity("")).toBeUndefined();
    // A code that's a substring of the real (current, rotating) one must not match either.
    db.addResident(MANAGER_ID, { bcaId: "200003", fullName: "Substring Check", room: "A3-103", className: RESIDENT_CLASSES[0], gender: "LAKI_LAKI", password: "password123" });
    const accountId = residentAccountId("200003");
    db.createPermit(accountId, { destination: "Pulang", permitType: "IZIN_PRIBADI", departure: "2026-01-01T10:00" });
    const { code } = findByAccount(accountId);
    const partial = code.slice(0, -1);
    expect(db.getPermitForSecurity(partial)).toBeUndefined();
  });
});

describe("secureCode via permit_code/entry_code generation", () => {
  it("only uses the unambiguous 32-char alphabet, never Math.random-style lowercase base36", () => {
    db.addResident(MANAGER_ID, { bcaId: "300001", fullName: "Cek Kode", room: "B3-101", className: RESIDENT_CLASSES[0], gender: "LAKI_LAKI", password: "password123" });
    const raw = new Database(dbPath);
    const accountId = (raw.prepare("SELECT id FROM accounts WHERE bca_id = ?").get("300001") as { id: number }).id;
    raw.close();
    const created = db.createPermit(accountId, { destination: "Pulang", permitType: "IZIN_PRIBADI", departure: "2026-01-01T10:00" });
    const suffix = created.code.replace("SKT-", "");
    expect(suffix).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
  });
});

describe("rate limiting (isRateLimited / recordFailedAttempt / clearAttempts)", () => {
  it("SCAN allows up to 19 failed attempts and blocks at 20 within the window", () => {
    const identifier = "SCANTEST";
    for (let i = 0; i < 19; i++) db.recordFailedAttempt(identifier, "SCAN");
    expect(db.isRateLimited(identifier, "SCAN")).toBe(false);
    db.recordFailedAttempt(identifier, "SCAN");
    expect(db.isRateLimited(identifier, "SCAN")).toBe(true);
  });

  it("LOGIN has a tighter threshold than SCAN (5, not 20)", () => {
    const identifier = "LOGINTEST";
    for (let i = 0; i < 4; i++) db.recordFailedAttempt(identifier, "LOGIN");
    expect(db.isRateLimited(identifier, "LOGIN")).toBe(false);
    db.recordFailedAttempt(identifier, "LOGIN");
    expect(db.isRateLimited(identifier, "LOGIN")).toBe(true);
  });

  it("clearAttempts resets the counter for that identifier+action", () => {
    const identifier = "CLEARTEST";
    for (let i = 0; i < 5; i++) db.recordFailedAttempt(identifier, "LOGIN");
    expect(db.isRateLimited(identifier, "LOGIN")).toBe(true);
    db.clearAttempts(identifier, "LOGIN");
    expect(db.isRateLimited(identifier, "LOGIN")).toBe(false);
  });

  it("different actions for the same identifier are tracked independently", () => {
    const identifier = "CROSSACTION";
    for (let i = 0; i < 5; i++) db.recordFailedAttempt(identifier, "LOGIN");
    expect(db.isRateLimited(identifier, "LOGIN")).toBe(true);
    expect(db.isRateLimited(identifier, "RESET_PASSWORD")).toBe(false);
  });

  it("LOGIN_IP allows up to 4 failed attempts and blocks at 5 within its window", () => {
    const ip = "203.0.113.42";
    for (let i = 0; i < 4; i++) db.recordFailedAttempt(ip, "LOGIN_IP");
    expect(db.isRateLimited(ip, "LOGIN_IP")).toBe(false);
    db.recordFailedAttempt(ip, "LOGIN_IP");
    expect(db.isRateLimited(ip, "LOGIN_IP")).toBe(true);
  });

  it("LOGIN_IP catches spraying many different bcaId values from one IP, which per-bcaId LOGIN limiting alone never sees", () => {
    const ip = "203.0.113.99";
    for (let i = 0; i < 5; i++) db.recordFailedAttempt(ip, "LOGIN_IP");
    // Every one of these bcaId values individually looks fine under LOGIN...
    expect(db.isRateLimited("777001", "LOGIN")).toBe(false);
    // ...but the shared IP behind all of them is now blocked.
    expect(db.isRateLimited(ip, "LOGIN_IP")).toBe(true);
  });
});

describe("Pengelola password reset via email", () => {
  function seedManagerWithEmail(bcaId: string, email: string | null) {
    const raw = new Database(dbPath);
    raw.prepare("INSERT INTO accounts (bca_id, full_name, role, password_hash, email) VALUES (?, ?, 'MANAGER', ?, ?)").run(bcaId, "Test Pengelola", "x", email);
    const id = (raw.prepare("SELECT id FROM accounts WHERE bca_id = ?").get(bcaId) as { id: number }).id;
    raw.close();
    return id;
  }

  it("issues a token only when the manager has an email on file, but the message is identical either way", () => {
    seedManagerWithEmail("900001", "pengelola@example.com");
    seedManagerWithEmail("900002", null);
    const withEmail = db.requestManagerPasswordReset("900001");
    const withoutEmail = db.requestManagerPasswordReset("900002");
    const nonexistent = db.requestManagerPasswordReset("900099");

    expect(withEmail.token).toBeTruthy();
    expect(withoutEmail.token).toBeUndefined();
    expect(nonexistent.token).toBeUndefined();
    // Same generic message for all three — an attacker can't distinguish
    // "real manager with email" from "no such account" by response text.
    expect(withEmail.message).toBe(withoutEmail.message);
    expect(withEmail.message).toBe(nonexistent.message);
  });

  it("a valid token resets the password and is then rejected on reuse", () => {
    seedManagerWithEmail("900003", "reset-me@example.com");
    const { token } = db.requestManagerPasswordReset("900003");
    const first = db.resetManagerPasswordWithToken(token!, "brandnewpassword1");
    expect(first.ok).toBe(true);
    const reused = db.resetManagerPasswordWithToken(token!, "anotherpassword2");
    expect(reused.ok).toBe(false);
  });

  it("an expired token is rejected", () => {
    seedManagerWithEmail("900004", "expired@example.com");
    const { token } = db.requestManagerPasswordReset("900004");
    const raw = new Database(dbPath);
    raw.prepare("UPDATE password_reset_tokens SET expires_at = datetime('now', '-1 hour') WHERE token_hash = ?")
      .run(createHash("sha256").update(token!).digest("hex"));
    raw.close();
    const result = db.resetManagerPasswordWithToken(token!, "somepassword123");
    expect(result.ok).toBe(false);
  });

  it("an unknown token is rejected", () => {
    const result = db.resetManagerPasswordWithToken("not-a-real-token", "somepassword123");
    expect(result.ok).toBe(false);
  });

  it("rejects a password shorter than 8 characters even with a valid token", () => {
    seedManagerWithEmail("900005", "short@example.com");
    const { token } = db.requestManagerPasswordReset("900005");
    const result = db.resetManagerPasswordWithToken(token!, "short");
    expect(result.ok).toBe(false);
  });
});

describe("resetStudentPassword", () => {
  it("rejects when name or room doesn't match the bcaId, with the same generic message either way", () => {
    db.addResident(MANAGER_ID, { bcaId: "600001", fullName: "Reset Saya", room: "B3-201", className: RESIDENT_CLASSES[0], gender: "LAKI_LAKI", password: "originalpass1" });

    const wrongName = db.resetStudentPassword({ bcaId: "600001", fullName: "Nama Salah", room: "B3-201", password: "newpassword123" });
    const wrongRoom = db.resetStudentPassword({ bcaId: "600001", fullName: "Reset Saya", room: "B3-202", password: "newpassword123" });
    const unknownBcaId = db.resetStudentPassword({ bcaId: "699999", fullName: "Siapa Saja", room: "B3-201", password: "newpassword123" });

    expect(wrongName.ok).toBe(false);
    expect(wrongRoom.ok).toBe(false);
    expect(unknownBcaId.ok).toBe(false);
    // Same generic message across all three — can't be used to probe which
    // bcaId is real or which field was the mismatch.
    expect(wrongName.message).toBe(wrongRoom.message);
    expect(wrongName.message).toBe(unknownBcaId.message);
  });

  it("resets the password when bcaId + name + room all match, and the new password actually works to log in", () => {
    db.addResident(MANAGER_ID, { bcaId: "600002", fullName: "Berhasil Reset", room: "B3-203", className: RESIDENT_CLASSES[0], gender: "LAKI_LAKI", password: "originalpass1" });

    const result = db.resetStudentPassword({ bcaId: "600002", fullName: "Berhasil Reset", room: "B3-203", password: "newpassword123" });
    expect(result.ok).toBe(true);

    expect(db.verifyCredentials("600002", "newpassword123")).not.toBeNull();
    expect(db.verifyCredentials("600002", "originalpass1")).toBeNull();
  });

  it("name/room matching ignores case and extra whitespace, but still requires an actual match", () => {
    db.addResident(MANAGER_ID, { bcaId: "600003", fullName: "Kasus Spasi", room: "B3-204", className: RESIDENT_CLASSES[0], gender: "LAKI_LAKI", password: "originalpass1" });

    const messyButCorrect = db.resetStudentPassword({ bcaId: "600003", fullName: "  kasus   spasi  ", room: " b3-204 ", password: "newpassword123" });
    expect(messyButCorrect.ok).toBe(true);
  });
});

describe("changePassword", () => {
  it("rejects the wrong current password and accepts the right one", () => {
    db.addResident(MANAGER_ID, { bcaId: "400001", fullName: "Ganti Password", room: "B3-102", className: RESIDENT_CLASSES[0], gender: "LAKI_LAKI", password: "originalpass1" });
    const raw = new Database(dbPath);
    const accountId = (raw.prepare("SELECT id FROM accounts WHERE bca_id = ?").get("400001") as { id: number }).id;
    raw.close();

    const wrong = db.changePassword(accountId, { currentPassword: "not-the-password", password: "newpassword123" });
    expect(wrong.ok).toBe(false);

    const right = db.changePassword(accountId, { currentPassword: "originalpass1", password: "newpassword123" });
    expect(right.ok).toBe(true);
  });
});

describe("isAccountActive", () => {
  it("flips to false the moment a resident is deactivated — the check lib/auth.ts relies on to revoke a live session", () => {
    db.addResident(MANAGER_ID, { bcaId: "400002", fullName: "Nonaktifkan Saya", room: "B3-103", className: RESIDENT_CLASSES[0], gender: "LAKI_LAKI", password: "originalpass1" });
    const raw = new Database(dbPath);
    const residentId = (raw.prepare("SELECT id FROM master_residents WHERE bca_id = ?").get("400002") as { id: number }).id;
    const accountId = (raw.prepare("SELECT id FROM accounts WHERE bca_id = ?").get("400002") as { id: number }).id;
    raw.close();

    expect(db.isAccountActive(accountId)).toBe(true);

    db.updateResident(MANAGER_ID, { id: residentId, fullName: "Nonaktifkan Saya", room: "B3-103", className: RESIDENT_CLASSES[0], gender: "LAKI_LAKI", residentStatus: "INACTIVE" });

    expect(db.isAccountActive(accountId)).toBe(false);
  });

  it("returns false for an account id that doesn't exist", () => {
    expect(db.isAccountActive(999_999_999)).toBe(false);
  });
});
