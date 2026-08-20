import "server-only";

import bcrypt from "bcryptjs";
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { RESIDENT_CLASSES } from "@/lib/ui";
import { WINGS, genderLabel, wingFromRoom } from "@/lib/wings";

export type Role = "STUDENT" | "SECURITY" | "MANAGER";
export type PermitStatus = "MENUNGGU_KELUAR" | "SEDANG_DI_LUAR" | "MENUNGGU_MASUK" | "SELESAI" | "DIBATALKAN";
export type Gender = "LAKI_LAKI" | "PEREMPUAN" | "TIDAK_DISEBUTKAN";
export type ReportPeriod = "DAY" | "WEEK" | "MONTH" | "YEAR" | "ALL";

type AccountRow = {
  id: number;
  bca_id: string;
  role: Role;
  password_hash: string;
  full_name: string;
  room_number: string | null;
  is_active: number;
  must_change_password: number;
};

type ResidentRow = {
  id: number;
  bca_id: string;
  full_name: string;
  room_number: string;
  class_name: string;
  gender: Gender;
  resident_status: string;
  phone_number: string | null;
  email: string | null;
};

let database: Database.Database | undefined;

function databasePath() {
  const configured = process.env.DATABASE_URL?.replace(/^file:/, "");
  return configured ? path.resolve(configured) : path.join(process.cwd(), "data", "sikat.db");
}

function getDb() {
  if (database) return database;
  const filePath = databasePath();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  database = new Database(filePath);
  database.pragma("journal_mode = WAL");
  database.pragma("busy_timeout = 5000");
  database.exec(`
    CREATE TABLE IF NOT EXISTS master_residents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bca_id TEXT NOT NULL UNIQUE,
      full_name TEXT NOT NULL,
      room_number TEXT NOT NULL,
      class_name TEXT NOT NULL,
      gender TEXT NOT NULL DEFAULT 'TIDAK_DISEBUTKAN',
      resident_status TEXT NOT NULL DEFAULT 'ACTIVE',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      resident_id INTEGER UNIQUE,
      bca_id TEXT NOT NULL UNIQUE,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('STUDENT','SECURITY','MANAGER')),
      password_hash TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      must_change_password INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(resident_id) REFERENCES master_residents(id)
    );
    CREATE TABLE IF NOT EXISTS security_staff (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bca_id TEXT NOT NULL UNIQUE,
      full_name TEXT NOT NULL,
      gender TEXT NOT NULL DEFAULT 'TIDAK_DISEBUTKAN',
      staff_status TEXT NOT NULL DEFAULT 'ACTIVE',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS permits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      resident_id INTEGER NOT NULL,
      permit_code TEXT NOT NULL UNIQUE,
      qr_token TEXT NOT NULL UNIQUE,
      destination TEXT NOT NULL,
      permit_type TEXT NOT NULL DEFAULT 'IZIN_PRIBADI',
      planned_departure_at TEXT NOT NULL,
      planned_return_at TEXT NOT NULL,
      entry_code TEXT,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(resident_id) REFERENCES master_residents(id)
    );
    CREATE TABLE IF NOT EXISTS permit_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      permit_id INTEGER NOT NULL,
      event_type TEXT NOT NULL,
      performed_by_account_id INTEGER,
      occurred_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(permit_id) REFERENCES permits(id),
      FOREIGN KEY(performed_by_account_id) REFERENCES accounts(id)
    );
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor_account_id INTEGER,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS login_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      identifier TEXT NOT NULL,
      action TEXT NOT NULL,
      attempted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS manager_bootstrap_links (
      bootstrap_bca_id TEXT PRIMARY KEY,
      account_id INTEGER NOT NULL UNIQUE,
      FOREIGN KEY(account_id) REFERENCES accounts(id)
    );
    CREATE TABLE IF NOT EXISTS broadcast_notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      created_by_account_id INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(created_by_account_id) REFERENCES accounts(id)
    );
    CREATE TABLE IF NOT EXISTS notification_deliveries (
      notification_id INTEGER NOT NULL,
      account_id INTEGER NOT NULL,
      read_at TEXT,
      PRIMARY KEY(notification_id, account_id),
      FOREIGN KEY(notification_id) REFERENCES broadcast_notifications(id),
      FOREIGN KEY(account_id) REFERENCES accounts(id)
    );
  `);
  ensureColumn(database, "accounts", "must_change_password", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(database, "master_residents", "gender", "TEXT NOT NULL DEFAULT 'TIDAK_DISEBUTKAN'");
  ensureColumn(database, "master_residents", "phone_number", "TEXT");
  ensureColumn(database, "master_residents", "email", "TEXT");
  ensureColumn(database, "security_staff", "gender", "TEXT NOT NULL DEFAULT 'TIDAK_DISEBUTKAN'");
  ensureColumn(database, "permits", "entry_code", "TEXT");
  ensureColumn(database, "permits", "permit_type", "TEXT NOT NULL DEFAULT 'IZIN_PRIBADI'");
  migrateLegacyDemoIds(database);
  seed(database);
  return database;
}

type BootstrapManager = { bcaId: string; password: string; name: string };

// Bootstrap one or more manager accounts without committing credentials. The
// insert is idempotent: existing manager accounts are never overwritten, so
// passwords remain under the account owner's control after first login.
function seed(db: Database.Database) {
  for (const manager of bootstrapManagers()) {
    const bcaId = normalizeBcaId(manager.bcaId);
    if (!/^\d{6}$/.test(bcaId) || manager.password.length < 8 || !manager.name.trim()) {
      throw new Error("Konfigurasi INITIAL_MANAGERS tidak valid.");
    }
    const linked = db.prepare("SELECT account_id FROM manager_bootstrap_links WHERE bootstrap_bca_id = ?").get(bcaId) as { account_id: number } | undefined;
    if (linked) {
      const linkedAccount = db.prepare("SELECT role FROM accounts WHERE id = ?").get(linked.account_id) as { role: Role } | undefined;
      if (linkedAccount?.role === "MANAGER") continue;
      db.prepare("DELETE FROM manager_bootstrap_links WHERE bootstrap_bca_id = ?").run(bcaId);
    }
    const existing = db.prepare("SELECT id, role FROM accounts WHERE bca_id = ?").get(bcaId) as { id: number; role: Role } | undefined;
    if (existing?.role === "MANAGER") {
      db.prepare("INSERT OR IGNORE INTO manager_bootstrap_links (bootstrap_bca_id, account_id) VALUES (?, ?)").run(bcaId, existing.id);
      continue;
    }
    if (existing) throw new Error("ID BCA bootstrap Pengelola sudah dipakai akun lain.");
    const account = db.prepare("INSERT INTO accounts (bca_id, full_name, role, password_hash, must_change_password) VALUES (?, ?, 'MANAGER', ?, 1)")
      .run(bcaId, manager.name.trim(), bcrypt.hashSync(manager.password, 12));
    db.prepare("INSERT INTO manager_bootstrap_links (bootstrap_bca_id, account_id) VALUES (?, ?)").run(bcaId, account.lastInsertRowid);
  }
}

function bootstrapManagers(): BootstrapManager[] {
  const managers: BootstrapManager[] = [];
  const configured = process.env.INITIAL_MANAGERS?.trim();
  if (configured) {
    let parsed: unknown;
    try { parsed = JSON.parse(configured); } catch { throw new Error("INITIAL_MANAGERS harus berupa JSON array yang valid."); }
    if (!Array.isArray(parsed)) throw new Error("INITIAL_MANAGERS harus berupa JSON array.");
    for (const item of parsed) {
      if (!item || typeof item !== "object") throw new Error("Konfigurasi INITIAL_MANAGERS tidak valid.");
      const value = item as Record<string, unknown>;
      managers.push({ bcaId: String(value.bcaId || ""), password: String(value.password || ""), name: String(value.name || "") });
    }
  }
  // Backwards-compatible single-manager configuration for existing installs.
  if (process.env.INITIAL_MANAGER_BCA_ID || process.env.INITIAL_MANAGER_PASSWORD) {
    managers.push({ bcaId: process.env.INITIAL_MANAGER_BCA_ID || "", password: process.env.INITIAL_MANAGER_PASSWORD || "", name: process.env.INITIAL_MANAGER_NAME || "Pengelola RTB" });
  }
  return managers;
}

function ensureColumn(db: Database.Database, table: string, column: string, definition: string) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  if (!columns.some((item) => item.name === column)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}

function migrateLegacyDemoIds(db: Database.Database) {
  db.prepare("UPDATE accounts SET bca_id = substr(bca_id, -4) WHERE bca_id LIKE 'BCA%'").run();
  db.prepare("UPDATE master_residents SET bca_id = substr(bca_id, -4) WHERE bca_id LIKE 'BCA%'").run();
  db.prepare("UPDATE accounts SET bca_id = '10' || bca_id WHERE role = 'STUDENT' AND length(bca_id) = 4 AND bca_id GLOB '[0-9]*'").run();
  db.prepare("UPDATE master_residents SET bca_id = '10' || bca_id WHERE length(bca_id) = 4 AND bca_id GLOB '[0-9]*'").run();
  db.prepare("UPDATE accounts SET bca_id = '900001' WHERE bca_id = 'SATPAM001'").run();
  // The current movement model has no return deadline. Existing overdue
  // records remain outside until the student creates a return QR.
  db.prepare("UPDATE permits SET status = 'SEDANG_DI_LUAR' WHERE status = 'TERLAMBAT'").run();
}

const RATE_LIMIT_MAX_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MINUTES = 15;

export type RateLimitAction = "LOGIN" | "RESET_PASSWORD";

export function isRateLimited(identifier: string, action: RateLimitAction) {
  const db = getDb();
  const windowStart = `-${RATE_LIMIT_WINDOW_MINUTES} minutes`;
  const { count } = db.prepare(`
    SELECT COUNT(*) AS count FROM login_attempts
    WHERE identifier = ? AND action = ? AND attempted_at >= datetime('now', ?)
  `).get(normalizeBcaId(identifier), action, windowStart) as { count: number };
  return count >= RATE_LIMIT_MAX_ATTEMPTS;
}

export function recordFailedAttempt(identifier: string, action: RateLimitAction) {
  const db = getDb();
  db.prepare("INSERT INTO login_attempts (identifier, action) VALUES (?, ?)").run(normalizeBcaId(identifier), action);
  // Opportunistic cleanup so this table never grows unbounded; cheap enough
  // to run on every write since it only touches already-expired rows.
  db.prepare("DELETE FROM login_attempts WHERE attempted_at < datetime('now', '-1 day')").run();
}

export function clearAttempts(identifier: string, action: RateLimitAction) {
  getDb().prepare("DELETE FROM login_attempts WHERE identifier = ? AND action = ?").run(normalizeBcaId(identifier), action);
}

export function verifyCredentials(bcaId: string, password: string) {
  const account = getDb()
    .prepare("SELECT * FROM accounts WHERE bca_id = ?")
    .get(normalizeBcaId(bcaId)) as AccountRow | undefined;
  if (!account || !account.is_active || !bcrypt.compareSync(password, account.password_hash)) return null;
  return { id: account.id, bcaId: account.bca_id, name: account.full_name, role: account.role, room: account.room_number, mustChangePassword: Boolean(account.must_change_password) };
}

export function getStudentData(accountId: number) {
  const db = getDb();
  const resident = db.prepare(`
    SELECT r.* FROM master_residents r JOIN accounts a ON a.resident_id = r.id WHERE a.id = ?
  `).get(accountId) as ResidentRow | undefined;
  if (!resident) return null;
  const activePermit = db.prepare(`
    SELECT * FROM permits WHERE resident_id = ? AND status IN ('MENUNGGU_KELUAR','SEDANG_DI_LUAR','MENUNGGU_MASUK')
    ORDER BY created_at DESC LIMIT 1
  `).get(resident.id) as PermitRow | undefined;
  const history = db.prepare(`
    SELECT * FROM permits WHERE resident_id = ? ORDER BY created_at DESC LIMIT 5
  `).all(resident.id) as PermitRow[];
  const latestDecision = db.prepare(`
    SELECT p.id AS permit_id, e.event_type, e.occurred_at
    FROM permit_events e
    JOIN permits p ON p.id = e.permit_id
    WHERE p.resident_id = ? AND e.event_type IN ('EXIT', 'ENTRY', 'EXIT_REJECTED')
    ORDER BY e.occurred_at DESC, e.id DESC
    LIMIT 1
  `).get(resident.id) as StudentPermitDecision | undefined;
  return { resident, activePermit, history, latestDecision };
}

export type StudentPermitDecision = {
  permit_id: number;
  event_type: "EXIT" | "ENTRY" | "EXIT_REJECTED";
  occurred_at: string;
};

export function getStudentPermitDecision(accountId: number) {
  const data = getStudentData(accountId);
  return data?.latestDecision;
}

type PermitRow = {
  id: number;
  resident_id: number;
  permit_code: string;
  qr_token: string;
  destination: string;
  permit_type: string;
  planned_departure_at: string;
  planned_return_at: string;
  entry_code: string | null;
  status: PermitStatus;
  created_at: string;
};

export function createPermit(accountId: number, input: { destination?: string; permitType?: string; departure?: string; returnAt?: string }) {
  const db = getDb();
  const resident = db.prepare("SELECT r.* FROM master_residents r JOIN accounts a ON a.resident_id = r.id WHERE a.id = ?").get(accountId) as ResidentRow | undefined;
  if (!resident) throw new Error("Profil mahasiswa tidak ditemukan.");
  const current = db.prepare("SELECT * FROM permits WHERE resident_id = ? AND status IN ('MENUNGGU_KELUAR','SEDANG_DI_LUAR','MENUNGGU_MASUK') ORDER BY created_at DESC LIMIT 1").get(resident.id) as PermitRow | undefined;
  if (current?.status === "MENUNGGU_KELUAR") throw new Error("QR keluar masih menunggu validasi satpam.");
  if (current?.status === "MENUNGGU_MASUK") throw new Error("QR masuk masih menunggu validasi satpam.");
  if (current?.status === "SEDANG_DI_LUAR") {
    if (!input.returnAt) throw new Error("Masukkan waktu kembali ke RTB.");
    const entryCode = `SKM-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    db.prepare("UPDATE permits SET entry_code = ?, planned_return_at = ?, status = 'MENUNGGU_MASUK' WHERE id = ?").run(entryCode, input.returnAt, current.id);
    db.prepare("INSERT INTO permit_events (permit_id, event_type, performed_by_account_id) VALUES (?, 'ENTRY_REQUESTED', ?)").run(current.id, accountId);
    return { code: entryCode, mode: "ENTRY" as const };
  }
  const permitType = input.permitType || "IZIN_PRIBADI";
  if (!input.destination?.trim() || !input.departure || !["IZIN_PRIBADI", "IZIN_AKADEMIK", "IZIN_KESEHATAN", "KEPERLUAN_KELUARGA", "LAINNYA"].includes(permitType)) throw new Error("Lengkapi informasi izin dan waktu keluar.");
  const permitCode = `SKT-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  const qrToken = crypto.randomUUID();
  const result = db.prepare(`
    INSERT INTO permits (resident_id, permit_code, qr_token, destination, permit_type, planned_departure_at, planned_return_at, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'MENUNGGU_KELUAR')
  `).run(resident.id, permitCode, qrToken, input.destination.trim(), permitType, input.departure, input.departure);
  db.prepare("INSERT INTO permit_events (permit_id, event_type, performed_by_account_id) VALUES (?, 'EXIT_REQUESTED', ?)").run(result.lastInsertRowid, accountId);
  return { code: permitCode, mode: "EXIT" as const };
}

export function cancelPendingPermit(accountId: number, permitId: number) {
  const db = getDb();
  const transaction = db.transaction(() => {
    const permit = db.prepare(`
      SELECT p.id FROM permits p
      JOIN master_residents r ON r.id = p.resident_id
      JOIN accounts a ON a.resident_id = r.id
      WHERE p.id = ? AND a.id = ? AND a.role = 'STUDENT'
        AND p.status IN ('MENUNGGU_KELUAR', 'MENUNGGU_MASUK')
    `).get(permitId, accountId) as { id: number } | undefined;
    if (!permit) return false;
    db.prepare("DELETE FROM permit_events WHERE permit_id = ?").run(permit.id);
    return db.prepare("DELETE FROM permits WHERE id = ?").run(permit.id).changes === 1;
  });
  return transaction() ? { ok: true, message: "Pengajuan dan QR berhasil dibatalkan." } : { ok: false, message: "QR tidak dapat dibatalkan karena sudah diproses satpam." };
}

export function getPermitForSecurity(code: string) {
  const db = getDb();
  return db.prepare(`
    SELECT p.*, r.full_name, r.room_number, r.class_name
    FROM permits p JOIN master_residents r ON r.id = p.resident_id
    WHERE (p.status = 'MENUNGGU_KELUAR' AND (p.permit_code = ? OR p.qr_token = ?))
       OR (p.status = 'MENUNGGU_MASUK' AND p.entry_code = ?)
  `).get(code.trim().toUpperCase(), code.trim(), code.trim().toUpperCase()) as (PermitRow & { full_name: string; room_number: string; class_name: string }) | undefined;
}

export function decidePermit(accountId: number, permitId: number, decision: "APPROVE" | "REJECT") {
  const db = getDb();
  const permit = db.prepare("SELECT * FROM permits WHERE id = ?").get(permitId) as PermitRow | undefined;
  if (!permit) return { ok: false, message: "Izin tidak ditemukan." };
  if (permit.status === "MENUNGGU_MASUK" && decision === "REJECT") return { ok: false, message: "QR masuk tidak dapat dibatalkan dari proses ini." };
  const isExit = permit.status === "MENUNGGU_KELUAR";
  const isEntry = permit.status === "MENUNGGU_MASUK";
  if (!isExit && !isEntry) return { ok: false, message: "QR ini sudah digunakan atau belum siap divalidasi." };
  const next = isExit ? decision === "APPROVE" ? "SEDANG_DI_LUAR" : "DIBATALKAN" : "SELESAI";
  const event = isExit ? decision === "APPROVE" ? "EXIT" : "EXIT_REJECTED" : "ENTRY";
  const transaction = db.transaction(() => {
    const update = db.prepare("UPDATE permits SET status = ? WHERE id = ? AND status = ?").run(next, permitId, permit.status);
    if (!update.changes) return false;
    db.prepare("INSERT INTO permit_events (permit_id, event_type, performed_by_account_id) VALUES (?, ?, ?)").run(permitId, event, accountId);
    return true;
  });
  if (!transaction()) return { ok: false, message: "Status izin sudah berubah. Silakan pindai ulang QR." };
  const resident = db.prepare("SELECT full_name, phone_number, email FROM master_residents WHERE id = ?").get(permit.resident_id) as { full_name: string; phone_number: string | null; email: string | null } | undefined;
  const notif = { permitCode: permit.permit_code, entryCode: permit.entry_code, destination: permit.destination, departureAt: permit.planned_departure_at, returnAt: permit.planned_return_at };
  if (event === "EXIT") return { ok: true, message: "Izin keluar disetujui. Mahasiswa kini berstatus di luar RTB.", event, resident, notif };
  if (event === "EXIT_REJECTED") return { ok: true, message: "Izin dibatalkan. Mahasiswa tetap berstatus di dalam RTB.", event, resident, notif };
  return { ok: true, message: "Masuk disetujui. Mahasiswa kini kembali tercatat di RTB.", event, resident, notif };
}

const eventPeriodWhere: Record<ReportPeriod, string> = {
  DAY: "date(e.occurred_at, '+7 hours') = date('now', '+7 hours')",
  WEEK: "date(e.occurred_at, '+7 hours') >= date('now', '-6 days', '+7 hours')",
  MONTH: "date(e.occurred_at, '+7 hours') >= date('now', 'start of month', '+7 hours')",
  YEAR: "date(e.occurred_at, '+7 hours') >= date('now', 'start of year', '+7 hours')",
  ALL: "1 = 1",
};

// Full keluar-masuk history across all satpam (not scoped to one account) —
// shared by the satpam "Riwayat" page (no filters, always ALL/300) and the
// pengelola "Riwayat" page (wing/kelas/period filters), so both read the
// same connected activity feed with who validated each entry. Wing isn't a
// stored column, so it's filtered in JS after the SQL fetch (see
// insertResidentRow for why); the 300-row cap is applied after that filter
// so it caps what's actually shown, not what's fetched pre-filter.
export function getPermitHistory(filters?: { wing?: string[]; className?: string[]; period?: ReportPeriod }) {
  const period = filters?.period ?? "ALL";
  const classNames = (filters?.className ?? []).filter(Boolean);
  const classFilter = classNames.length ? `AND r.class_name IN (${classNames.map(() => "?").join(",")})` : "";
  const rows = getDb().prepare(`
    SELECT e.id AS event_id, e.event_type, e.occurred_at,
      p.permit_code, p.entry_code, p.destination, p.status,
      r.full_name, r.room_number, r.class_name,
      a.full_name AS performed_by_name
    FROM permit_events e
    JOIN permits p ON p.id = e.permit_id
    JOIN master_residents r ON r.id = p.resident_id
    LEFT JOIN accounts a ON a.id = e.performed_by_account_id
    WHERE e.event_type IN ('EXIT', 'ENTRY', 'EXIT_REJECTED')
      AND ${eventPeriodWhere[period]} ${classFilter}
    ORDER BY e.occurred_at DESC, e.id DESC
  `).all(...classNames) as Array<{
    event_id: number;
    event_type: "EXIT" | "ENTRY" | "EXIT_REJECTED";
    occurred_at: string;
    permit_code: string;
    entry_code: string | null;
    destination: string;
    status: PermitStatus;
    full_name: string;
    room_number: string;
    class_name: string;
    performed_by_name: string | null;
  }>;
  const wings = (filters?.wing ?? []).filter(Boolean);
  const filtered = wings.length ? rows.filter((row) => { const wing = wingFromRoom(row.room_number); return wing && wings.includes(wing.code); }) : rows;
  return filtered.slice(0, 300);
}

function jakartaToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
}

function addDaysToDateString(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function isValidDateString(value: string | undefined): value is string {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

// Resolves a user-supplied date range (e.g. from dashboard query params) to
// valid, ordered "YYYY-MM-DD" bounds, falling back to the last N days ending
// today (Jakarta) when either bound is missing/invalid. `to` is clamped to
// today so a mistyped future date can't silently return an empty chart.
function resolveDateRange(from: string | undefined, to: string | undefined, defaultSpanDays: number) {
  const today = jakartaToday();
  const resolvedTo = isValidDateString(to) && to <= today ? to : today;
  const resolvedFrom = isValidDateString(from) ? from : addDaysToDateString(resolvedTo, -(defaultSpanDays - 1));
  return resolvedFrom > resolvedTo ? { from: resolvedTo, to: resolvedFrom } : { from: resolvedFrom, to: resolvedTo };
}

// Capped at a year so a mistyped/very wide custom range can't blow up the
// bar chart into thousands of slivers — the chart also scrolls horizontally.
function enumerateDays(from: string, to: string, maxDays = 366): string[] {
  const days: string[] = [];
  let cursor = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  while (cursor <= end && days.length < maxDays) {
    days.push(cursor.toISOString().slice(0, 10));
    cursor = new Date(cursor.getTime() + 86_400_000);
  }
  return days;
}

export function getManagerData(options?: { activityFrom?: string; activityTo?: string; peakFrom?: string; peakTo?: string; wingFrom?: string; wingTo?: string }) {
  const db = getDb();
  const stats = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM master_residents WHERE resident_status = 'ACTIVE') AS residents,
      (SELECT COUNT(*) FROM permits WHERE status IN ('SEDANG_DI_LUAR', 'MENUNGGU_MASUK')) AS outside,
      (SELECT COUNT(*) FROM permits WHERE date(created_at, '+7 hours') = date('now', '+7 hours')) AS today,
      (SELECT COUNT(DISTINCT p.resident_id) FROM permit_events e JOIN permits p ON p.id = e.permit_id
        WHERE e.event_type = 'EXIT' AND date(e.occurred_at, '+7 hours') = date('now', '+7 hours')) AS exitedToday
  `).get() as { residents: number; outside: number; today: number; exitedToday: number };
  // Recent activity feed: latest EXIT/ENTRY_REQUESTED per permit still open,
  // scoped to the last rolling 24 hours. Satpam has a separate unrestricted
  // QR-code lookup flow (getPermitForSecurity) so a student who's been out
  // for days can still be validated on return — this 24h window only
  // affects the pengelola dashboard's feed, not satpam's ability to act.
  const recentActivity = db.prepare(`
    SELECT p.*, r.full_name, r.room_number
    FROM permits p
    JOIN master_residents r ON r.id = p.resident_id
    JOIN permit_events e ON e.permit_id = p.id
    WHERE p.status IN ('SEDANG_DI_LUAR', 'MENUNGGU_MASUK')
      AND e.event_type IN ('EXIT', 'ENTRY_REQUESTED')
      AND e.occurred_at = (
        SELECT MAX(e2.occurred_at) FROM permit_events e2
        WHERE e2.permit_id = p.id AND e2.event_type IN ('EXIT', 'ENTRY_REQUESTED')
      )
      AND e.occurred_at >= datetime('now', '-24 hours')
    ORDER BY e.occurred_at DESC
  `).all() as Array<PermitRow & { full_name: string; room_number: string }>;

  // Derive each day's key/label from an explicit Asia/Jakarta projection
  // rather than the server's own local calendar (Railway runs in UTC) — a
  // day boundary computed in UTC would drift by up to 7 hours from the
  // Jakarta day the SQL query below buckets by.
  const activityRange = resolveDateRange(options?.activityFrom, options?.activityTo, 7);
  const activityDays = enumerateDays(activityRange.from, activityRange.to);
  const clampedActivityFrom = activityDays[0] ?? activityRange.from;
  const activityRows = db.prepare(`
    SELECT date(occurred_at, '+7 hours') AS day,
      SUM(CASE WHEN event_type = 'EXIT' THEN 1 ELSE 0 END) AS exits,
      SUM(CASE WHEN event_type = 'ENTRY' THEN 1 ELSE 0 END) AS entries
    FROM permit_events
    WHERE event_type IN ('EXIT', 'ENTRY') AND date(occurred_at, '+7 hours') BETWEEN ? AND ?
    GROUP BY day
  `).all(clampedActivityFrom, activityRange.to) as Array<{ day: string; exits: number; entries: number }>;
  const activityByDay = new Map(activityRows.map((item) => [item.day, item]));
  const weeklyActivity = activityDays.map((day) => ({
    day,
    label: new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", timeZone: "Asia/Jakarta" }).format(new Date(`${day}T00:00:00Z`)),
    exits: activityByDay.get(day)?.exits || 0,
    entries: activityByDay.get(day)?.entries || 0,
  }));

  const residents = db.prepare(`
    SELECT r.*, CASE WHEN a.id IS NULL THEN 'Belum aktif' ELSE 'Aktif' END AS account_status
    FROM master_residents r LEFT JOIN accounts a ON a.resident_id = r.id
    ORDER BY r.full_name ASC
  `).all() as Array<ResidentRow & { account_status: string }>;
  const securityStaff = db.prepare("SELECT * FROM security_staff ORDER BY full_name ASC").all() as Array<{ id: number; bca_id: string; full_name: string; gender: Gender; staff_status: string }>;

  // Hour-of-day bucketing over the selected range (Jakarta time), same
  // reasoning as weeklyActivity above for why the day boundary is explicit.
  const peakRange = resolveDateRange(options?.peakFrom, options?.peakTo, 30);
  const hourRows = db.prepare(`
    SELECT strftime('%H', occurred_at, '+7 hours') AS hour,
      SUM(CASE WHEN event_type = 'EXIT' THEN 1 ELSE 0 END) AS exits,
      SUM(CASE WHEN event_type = 'ENTRY' THEN 1 ELSE 0 END) AS entries
    FROM permit_events
    WHERE event_type IN ('EXIT', 'ENTRY') AND date(occurred_at, '+7 hours') BETWEEN ? AND ?
    GROUP BY hour
  `).all(peakRange.from, peakRange.to) as Array<{ hour: string; exits: number; entries: number }>;
  const hourByKey = new Map(hourRows.map((item) => [item.hour, item]));
  const peakHours = Array.from({ length: 24 }, (_, hour) => {
    const key = String(hour).padStart(2, "0");
    const values = hourByKey.get(key);
    return { hour, exits: values?.exits || 0, entries: values?.entries || 0 };
  });

  // Wing is derived from the room number prefix (see lib/wings.ts), not a
  // stored column, so activity is aggregated in JS after fetching rooms.
  // Independent range from peakRange — each dashboard panel gets its own
  // calendar picker.
  const wingRange = resolveDateRange(options?.wingFrom, options?.wingTo, 30);
  const wingRooms = db.prepare(`
    SELECT r.room_number FROM permits p JOIN master_residents r ON r.id = p.resident_id
    WHERE date(p.created_at, '+7 hours') BETWEEN ? AND ?
  `).all(wingRange.from, wingRange.to) as Array<{ room_number: string }>;
  const wingCounts = new Map<string, number>();
  for (const row of wingRooms) {
    const wing = wingFromRoom(row.room_number);
    const key = wing?.code ?? "LAINNYA";
    wingCounts.set(key, (wingCounts.get(key) || 0) + 1);
  }
  const otherWingCount = wingCounts.get("LAINNYA") || 0;
  // All wings always included (even zero-activity ones) so the ranking never
  // hides a wing — only appended "Lainnya" bucket is conditional.
  const wingActivity = [
    ...WINGS.map((wing) => ({ code: wing.code, floor: wing.floor, gender: wing.gender as Gender, count: wingCounts.get(wing.code) || 0 })),
    ...(otherWingCount > 0 ? [{ code: "LAINNYA", floor: "Format kamar lama", gender: "TIDAK_DISEBUTKAN" as Gender, count: otherWingCount }] : []),
  ].sort((a, b) => b.count - a.count);

  return {
    stats, recentActivity, weeklyActivity, peakHours, wingActivity, residents, securityStaff,
    range: {
      activityFrom: activityRange.from, activityTo: activityRange.to,
      peakFrom: peakRange.from, peakTo: peakRange.to,
      wingFrom: wingRange.from, wingTo: wingRange.to,
    },
  };
}

function normalizeGender(value: string | undefined): Gender | null {
  const v = (value ?? "").trim().toUpperCase();
  if (["L", "LAKI-LAKI", "LAKI LAKI", "LAKI_LAKI"].includes(v)) return "LAKI_LAKI";
  if (["P", "PEREMPUAN"].includes(v)) return "PEREMPUAN";
  return null;
}

// Shared by the single-resident form and the bulk Excel import so both paths
// enforce identical rules (unique ID BCA, known class, 2-per-room cap).
function insertResidentRow(actorId: number, input: { bcaId: string; fullName: string; room: string; className: string; gender: Gender; password: string; phoneNumber?: string; email?: string }): { ok: boolean; message: string } {
  const db = getDb();
  const bcaId = normalizeBcaId(input.bcaId);
  if (!/^\d{6}$/.test(bcaId)) return { ok: false, message: "ID BCA harus terdiri dari 6 angka." };
  if (!input.fullName.trim() || !input.room.trim()) return { ok: false, message: "Nama lengkap dan kamar wajib diisi." };
  if (!(RESIDENT_CLASSES as readonly string[]).includes(input.className)) return { ok: false, message: `Kelas "${input.className}" tidak dikenal.` };
  if (!["LAKI_LAKI", "PEREMPUAN"].includes(input.gender)) return { ok: false, message: "Jenis kelamin tidak valid." };
  if (input.password.length < 8) return { ok: false, message: "Password awal minimal 8 karakter." };
  const phoneNumber = normalizePhoneNumber(input.phoneNumber);
  if (input.phoneNumber?.trim() && !phoneNumber) return { ok: false, message: "Nomor WA tidak valid. Gunakan format 08xxxxxxxxxx." };
  const email = normalizeEmail(input.email);
  if (input.email?.trim() && !email) return { ok: false, message: "Alamat email tidak valid." };
  const existing = db.prepare("SELECT id FROM accounts WHERE bca_id = ?").get(bcaId);
  if (existing) return { ok: false, message: "ID BCA ini sudah terdaftar, pakai ID BCA lainnya." };
  const room = input.room.trim().toUpperCase();
  const wing = wingFromRoom(room);
  if (!wing) return { ok: false, message: `Format kamar "${room}" tidak dikenali. Gunakan format WING-NOMOR, contoh A1-101.` };
  if (wing.gender !== input.gender) return { ok: false, message: `Kamar ${room} ada di wing ${wing.code} (${wing.floor}), khusus ${genderLabel(wing.gender)}.` };
  const occupants = db.prepare("SELECT COUNT(*) AS count FROM master_residents WHERE room_number = ? AND resident_status = 'ACTIVE'").get(room) as { count: number };
  if (occupants.count >= 2) return { ok: false, message: `Kamar ${room} sudah dihuni 2 orang. Satu kamar hanya untuk maksimal 2 penghuni.` };
  try {
    const transaction = db.transaction(() => {
      const resident = db.prepare("INSERT INTO master_residents (bca_id, full_name, room_number, class_name, gender, phone_number, email) VALUES (?, ?, ?, ?, ?, ?, ?)").run(bcaId, input.fullName.trim(), room, input.className, input.gender, phoneNumber, email);
      const account = db.prepare("INSERT INTO accounts (resident_id, bca_id, full_name, role, password_hash, must_change_password) VALUES (?, ?, ?, 'STUDENT', ?, 1)").run(resident.lastInsertRowid, bcaId, input.fullName.trim(), bcrypt.hashSync(input.password, 12));
      logAudit(actorId, "CREATE_STUDENT_ACCOUNT", "account", String(account.lastInsertRowid));
    });
    transaction();
    return { ok: true, message: "Berhasil ditambahkan." };
  } catch {
    return { ok: false, message: "ID BCA sudah terdaftar atau data tidak valid." };
  }
}

export function addResident(actorId: number, input: { bcaId: string; fullName: string; room: string; className: string; gender: Gender; password: string; phoneNumber?: string; email?: string }) {
  const result = insertResidentRow(actorId, input);
  return result.ok ? { ok: true, message: "Akun mahasiswa berhasil dibuat. User wajib mengganti password saat login pertama." } : result;
}

// Bulk-create residents from a parsed Excel/CSV sheet. Each row is validated
// and inserted independently (not one big transaction) so a handful of bad
// rows don't block the hundreds of good ones — mirrors how spreadsheet
// importers are expected to behave.
export function importResidents(actorId: number, rows: Array<{ bcaId: string; fullName: string; room: string; className: string; gender: string; password: string; phoneNumber?: string; email?: string }>) {
  const results: Array<{ row: number; ok: boolean; message: string }> = [];
  rows.forEach((input, index) => {
    const rowNumber = index + 2; // spreadsheet row, accounting for the header row
    const gender = normalizeGender(input.gender);
    if (!gender) {
      results.push({ row: rowNumber, ok: false, message: `Jenis kelamin "${input.gender}" tidak dikenal (pakai L atau P).` });
      return;
    }
    const result = insertResidentRow(actorId, { ...input, gender });
    results.push({ row: rowNumber, ok: result.ok, message: result.message });
  });
  const successCount = results.filter((r) => r.ok).length;
  if (successCount > 0) logAudit(actorId, "IMPORT_RESIDENTS", "master_resident", `${successCount} baris berhasil dari ${rows.length}`);
  return { successCount, failCount: results.length - successCount, results };
}

export function addSecurityStaff(actorId: number, input: { bcaId: string; fullName: string; gender: Gender; password: string }) {
  const db = getDb();
  const bcaId = normalizeBcaId(input.bcaId);
  if (!/^\d{5}$/.test(bcaId)) return { ok: false, message: "ID satpam harus terdiri dari 5 angka." };
  const existing = db.prepare("SELECT id FROM accounts WHERE bca_id = ?").get(bcaId);
  if (existing) return { ok: false, message: "ID BCA ini sudah terdaftar, pakai ID BCA lainnya." };
  try {
    const transaction = db.transaction(() => {
      db.prepare("INSERT INTO security_staff (bca_id, full_name, gender) VALUES (?, ?, ?)").run(bcaId, input.fullName.trim(), input.gender);
      db.prepare("INSERT INTO accounts (bca_id, full_name, role, password_hash, must_change_password) VALUES (?, ?, 'SECURITY', ?, 1)").run(bcaId, input.fullName.trim(), bcrypt.hashSync(input.password, 12));
    });
    transaction();
    logAudit(actorId, "CREATE_SECURITY_STAFF", "security_staff", bcaId);
    return { ok: true, message: "Akun satpam berhasil dibuat." };
  } catch { return { ok: false, message: "ID BCA satpam sudah digunakan atau data tidak valid." }; }
}

export function updateSecurityStaff(actorId: number, input: { id: number; fullName: string; gender: Gender; staffStatus: "ACTIVE" | "INACTIVE" }) {
  const db = getDb();
  const staff = db.prepare("SELECT bca_id FROM security_staff WHERE id = ?").get(input.id) as { bca_id: string } | undefined;
  if (!staff) return { ok: false, message: "Data satpam tidak ditemukan." };
  db.prepare("UPDATE security_staff SET full_name = ?, gender = ?, staff_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(input.fullName.trim(), input.gender, input.staffStatus, input.id);
  db.prepare("UPDATE accounts SET full_name = ?, is_active = ? WHERE bca_id = ? AND role = 'SECURITY'").run(input.fullName.trim(), input.staffStatus === "ACTIVE" ? 1 : 0, staff.bca_id);
  logAudit(actorId, "UPDATE_SECURITY_STAFF", "security_staff", String(input.id));
  return { ok: true, message: input.staffStatus === "INACTIVE" ? "Satpam dinonaktifkan dan aksesnya dicabut." : "Data satpam diperbarui." };
}

export function deleteSecurityStaff(actorId: number, id: number) {
  const db = getDb();
  const staff = db.prepare("SELECT id, bca_id, full_name FROM security_staff WHERE id = ?").get(id) as { id: number; bca_id: string; full_name: string } | undefined;
  if (!staff) return { ok: false, message: "Data satpam tidak ditemukan." };
  const transaction = db.transaction(() => {
    const account = db.prepare("SELECT id FROM accounts WHERE bca_id = ? AND role = 'SECURITY'").get(staff.bca_id) as { id: number } | undefined;
    if (account) {
      db.prepare("DELETE FROM notification_deliveries WHERE account_id = ?").run(account.id);
      db.prepare("DELETE FROM accounts WHERE id = ?").run(account.id);
    }
    db.prepare("DELETE FROM security_staff WHERE id = ?").run(id);
    logAudit(actorId, "DELETE_SECURITY_STAFF", "security_staff", String(id));
  });
  transaction();
  return { ok: true, message: `Data satpam "${staff.full_name}" berhasil dihapus dari sistem.` };
}

export function updateResident(actorId: number, input: { id: number; fullName: string; room: string; className: string; gender: Gender; residentStatus: "ACTIVE" | "INACTIVE"; phoneNumber?: string; email?: string }) {
  const db = getDb();
  const resident = db.prepare("SELECT id, room_number, resident_status FROM master_residents WHERE id = ?").get(input.id) as { id: number; room_number: string; resident_status: string } | undefined;
  if (!resident) return { ok: false, message: "Data penghuni tidak ditemukan." };
  const phoneNumber = normalizePhoneNumber(input.phoneNumber);
  if (input.phoneNumber?.trim() && !phoneNumber) return { ok: false, message: "Nomor WA tidak valid. Gunakan format 08xxxxxxxxxx." };
  const email = normalizeEmail(input.email);
  if (input.email?.trim() && !email) return { ok: false, message: "Alamat email tidak valid." };
  const room = input.room.trim().toUpperCase();
  const wing = wingFromRoom(room);
  if (!wing) return { ok: false, message: `Format kamar "${room}" tidak dikenali. Gunakan format WING-NOMOR, contoh A1-101.` };
  if (wing.gender !== input.gender) return { ok: false, message: `Kamar ${room} ada di wing ${wing.code} (${wing.floor}), khusus ${genderLabel(wing.gender)}.` };
  const roomOrStatusChanged = room !== resident.room_number || input.residentStatus !== resident.resident_status;
  if (input.residentStatus === "ACTIVE" && roomOrStatusChanged) {
    const occupants = db.prepare("SELECT COUNT(*) AS count FROM master_residents WHERE room_number = ? AND resident_status = 'ACTIVE' AND id != ?").get(room, input.id) as { count: number };
    if (occupants.count >= 2) return { ok: false, message: `Kamar ${room} sudah dihuni 2 orang. Satu kamar hanya untuk maksimal 2 penghuni.` };
  }
  db.prepare(`
    UPDATE master_residents SET full_name = ?, room_number = ?, class_name = ?, gender = ?, resident_status = ?, phone_number = ?, email = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(input.fullName.trim(), room, input.className.trim(), input.gender, input.residentStatus, phoneNumber, email, input.id);
  if (input.residentStatus === "INACTIVE") {
    db.prepare("UPDATE accounts SET is_active = 0 WHERE resident_id = ?").run(input.id);
  }
  logAudit(actorId, "UPDATE_RESIDENT", "master_resident", String(input.id));
  return { ok: true, message: input.residentStatus === "INACTIVE" ? "Penghuni dinonaktifkan dan akses akunnya dicabut." : "Data penghuni berhasil diperbarui." };
}

// A resident editing their own contact info (room, WA, email) — same data as
// updateResident's target row, so it shows up in the Pengelola's Master
// Penghuni immediately, but scoped to only the fields a resident should be
// able to change themselves (never their own name, class, or active status).
export function updateOwnContactInfo(accountId: number, input: { room: string; phoneNumber?: string; email?: string }) {
  const db = getDb();
  const resident = db.prepare(`
    SELECT r.id, r.room_number, r.resident_status, r.gender FROM master_residents r JOIN accounts a ON a.resident_id = r.id
    WHERE a.id = ? AND a.role = 'STUDENT'
  `).get(accountId) as { id: number; room_number: string; resident_status: string; gender: Gender } | undefined;
  if (!resident) return { ok: false, message: "Data penghuni tidak ditemukan." };
  if (!input.room.trim()) return { ok: false, message: "Nomor kamar wajib diisi." };
  const phoneNumber = normalizePhoneNumber(input.phoneNumber);
  if (input.phoneNumber?.trim() && !phoneNumber) return { ok: false, message: "Nomor WA tidak valid. Gunakan format 08xxxxxxxxxx." };
  const email = normalizeEmail(input.email);
  if (input.email?.trim() && !email) return { ok: false, message: "Alamat email tidak valid." };
  const room = input.room.trim().toUpperCase();
  if (room !== resident.room_number) {
    const wing = wingFromRoom(room);
    if (!wing) return { ok: false, message: `Format kamar "${room}" tidak dikenali. Gunakan format WING-NOMOR, contoh A1-101.` };
    if (wing.gender !== resident.gender) return { ok: false, message: `Kamar ${room} ada di wing ${wing.code} (${wing.floor}), khusus ${genderLabel(wing.gender)}.` };
  }
  if (room !== resident.room_number && resident.resident_status === "ACTIVE") {
    const occupants = db.prepare("SELECT COUNT(*) AS count FROM master_residents WHERE room_number = ? AND resident_status = 'ACTIVE' AND id != ?").get(room, resident.id) as { count: number };
    if (occupants.count >= 2) return { ok: false, message: `Kamar ${room} sudah dihuni 2 orang. Satu kamar hanya untuk maksimal 2 penghuni.` };
  }
  db.prepare("UPDATE master_residents SET room_number = ?, phone_number = ?, email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(room, phoneNumber, email, resident.id);
  logAudit(accountId, "UPDATE_OWN_CONTACT", "master_resident", String(resident.id));
  return { ok: true, message: "Data kontak berhasil diperbarui." };
}

// Permanent removal for residents who have genuinely left RTB — unlike the
// INACTIVE status (which keeps the row for history but revokes login), this
// erases the resident and their permit history entirely.
export function deleteResident(actorId: number, id: number) {
  const db = getDb();
  const resident = db.prepare("SELECT id, full_name FROM master_residents WHERE id = ?").get(id) as { id: number; full_name: string } | undefined;
  if (!resident) return { ok: false, message: "Data penghuni tidak ditemukan." };
  const transaction = db.transaction(() => {
    db.prepare("DELETE FROM permit_events WHERE permit_id IN (SELECT id FROM permits WHERE resident_id = ?)").run(id);
    db.prepare("DELETE FROM permits WHERE resident_id = ?").run(id);
    const account = db.prepare("SELECT id FROM accounts WHERE resident_id = ?").get(id) as { id: number } | undefined;
    if (account) {
      db.prepare("DELETE FROM notification_deliveries WHERE account_id = ?").run(account.id);
      db.prepare("DELETE FROM accounts WHERE id = ?").run(account.id);
    }
    db.prepare("DELETE FROM master_residents WHERE id = ?").run(id);
    logAudit(actorId, "DELETE_RESIDENT", "master_resident", String(id));
  });
  transaction();
  return { ok: true, message: `Data penghuni "${resident.full_name}" berhasil dihapus dari sistem.` };
}

// Bulk version of deleteResident for the yearly turnover case — remove every
// resident (and their accounts/permit history) in one class at once instead
// of deleting them one by one.
export function deleteResidentsByClass(actorId: number, className: string) {
  const db = getDb();
  const count = (db.prepare("SELECT COUNT(*) AS count FROM master_residents WHERE class_name = ?").get(className) as { count: number }).count;
  if (count === 0) return { ok: false, message: `Tidak ada data penghuni di kelas ${className}.` };
  const transaction = db.transaction(() => {
    db.prepare(`DELETE FROM permit_events WHERE permit_id IN (SELECT p.id FROM permits p JOIN master_residents r ON r.id = p.resident_id WHERE r.class_name = ?)`).run(className);
    db.prepare(`DELETE FROM permits WHERE resident_id IN (SELECT id FROM master_residents WHERE class_name = ?)`).run(className);
    db.prepare(`DELETE FROM notification_deliveries WHERE account_id IN (SELECT a.id FROM accounts a JOIN master_residents r ON r.id = a.resident_id WHERE r.class_name = ?)`).run(className);
    db.prepare(`DELETE FROM accounts WHERE resident_id IN (SELECT id FROM master_residents WHERE class_name = ?)`).run(className);
    db.prepare(`DELETE FROM master_residents WHERE class_name = ?`).run(className);
    logAudit(actorId, "DELETE_RESIDENTS_BY_CLASS", "class", className);
  });
  transaction();
  return { ok: true, message: `${count} data penghuni kelas ${className} berhasil dihapus dari sistem.` };
}

export function resetStudentPassword(input: { bcaId: string; fullName: string; room: string; password: string }) {
  const db = getDb();
  const resident = db.prepare("SELECT * FROM master_residents WHERE bca_id = ?").get(normalizeBcaId(input.bcaId)) as ResidentRow | undefined;
  if (!resident || resident.resident_status !== "ACTIVE") return { ok: false, message: "Data akun tidak dapat diverifikasi." };
  if (normalizeName(resident.full_name) !== normalizeName(input.fullName) || normalizeRoom(resident.room_number) !== normalizeRoom(input.room)) {
    return { ok: false, message: "Data akun tidak dapat diverifikasi." };
  }
  const account = db.prepare("SELECT id FROM accounts WHERE resident_id = ? AND role = 'STUDENT' AND is_active = 1").get(resident.id) as { id: number } | undefined;
  if (!account) return { ok: false, message: "Akun tidak ditemukan. Hubungi Pengelola RTB." };
  db.prepare("UPDATE accounts SET password_hash = ?, must_change_password = 0 WHERE id = ?").run(bcrypt.hashSync(input.password, 12), account.id);
  logAudit(account.id, "RESET_PASSWORD", "account", String(account.id));
  return { ok: true, message: "Password berhasil diatur ulang. Silakan masuk dengan password baru." };
}

export function changePassword(accountId: number, input: { currentPassword: string; password: string }) {
  const db = getDb();
  const account = db.prepare("SELECT * FROM accounts WHERE id = ? AND is_active = 1").get(accountId) as AccountRow | undefined;
  if (!account || !bcrypt.compareSync(input.currentPassword, account.password_hash)) return { ok: false, message: "Password saat ini tidak tepat." };
  db.prepare("UPDATE accounts SET password_hash = ?, must_change_password = 0 WHERE id = ?").run(bcrypt.hashSync(input.password, 12), accountId);
  logAudit(accountId, "CHANGE_PASSWORD", "account", String(accountId));
  return { ok: true, message: "Password berhasil diperbarui." };
}

export function updateManagerProfile(accountId: number, input: { bcaId: string; fullName: string }) {
  const db = getDb();
  const bcaId = normalizeBcaId(input.bcaId);
  const fullName = input.fullName.trim().replace(/\s+/g, " ");
  if (!/^\d{6}$/.test(bcaId)) return { ok: false, message: "ID BCA harus terdiri dari 6 angka." };
  if (fullName.length < 2) return { ok: false, message: "Nama lengkap belum valid." };
  const account = db.prepare("SELECT id FROM accounts WHERE id = ? AND role = 'MANAGER' AND is_active = 1").get(accountId);
  if (!account) return { ok: false, message: "Akun pengelola tidak ditemukan." };
  try {
    db.prepare("UPDATE accounts SET bca_id = ?, full_name = ? WHERE id = ?").run(bcaId, fullName, accountId);
    logAudit(accountId, "UPDATE_MANAGER_PROFILE", "account", String(accountId));
    return { ok: true, message: "Profil pengelola berhasil diperbarui.", bcaId, fullName };
  } catch {
    return { ok: false, message: "ID BCA sudah digunakan oleh akun lain." };
  }
}

const reportPeriodWhere: Record<ReportPeriod, string> = {
  DAY: "date(p.created_at, '+7 hours') = date('now', '+7 hours')",
  WEEK: "date(p.created_at, '+7 hours') >= date('now', '-6 days', '+7 hours')",
  MONTH: "date(p.created_at, '+7 hours') >= date('now', 'start of month', '+7 hours')",
  YEAR: "date(p.created_at, '+7 hours') >= date('now', 'start of year', '+7 hours')",
  ALL: "1 = 1",
};

export function getReport(period: ReportPeriod, className?: string) {
  const db = getDb();
  const where = reportPeriodWhere[period];
  const classFilter = className ? "AND r.class_name = ?" : "";
  const params = className ? [className] : [];
  const rows = db.prepare(`
    SELECT p.permit_code, p.entry_code, r.bca_id, r.full_name, r.room_number, r.class_name, p.destination, p.permit_type,
      p.planned_departure_at, p.planned_return_at, p.status, p.created_at,
      MAX(CASE WHEN e.event_type = 'EXIT' THEN e.occurred_at END) AS actual_exit_at,
      MAX(CASE WHEN e.event_type = 'ENTRY' THEN e.occurred_at END) AS actual_entry_at
    FROM permits p
    JOIN master_residents r ON r.id = p.resident_id
    LEFT JOIN permit_events e ON e.permit_id = p.id
    WHERE ${where} ${classFilter}
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `).all(...params) as Array<Record<string, string | null>>;
  const activity = db.prepare(`
    SELECT
      SUM(CASE WHEN e.event_type = 'EXIT' THEN 1 ELSE 0 END) AS exits,
      SUM(CASE WHEN e.event_type = 'ENTRY' THEN 1 ELSE 0 END) AS entries
    FROM permit_events e
    JOIN permits p ON p.id = e.permit_id
    JOIN master_residents r ON r.id = p.resident_id
    WHERE ${where} ${classFilter}
  `).get(...params) as { exits: number | null; entries: number | null };
  return {
    rows,
    summary: {
      permits: rows.length,
      exits: activity.exits || 0,
      entries: activity.entries || 0,
      completed: rows.filter((row) => row.status === "SELESAI").length,
    },
  };
}

export function getDailyReport() {
  return getReport("DAY").rows;
}

export function getResidentsInside(className?: string) {
  const db = getDb();
  const classFilter = className ? "AND r.class_name = ?" : "";
  const params = className ? [className] : [];
  return db.prepare(`
    SELECT r.bca_id, r.full_name, r.room_number, r.class_name, r.gender
    FROM master_residents r
    WHERE r.resident_status = 'ACTIVE' ${classFilter}
      AND r.id NOT IN (SELECT resident_id FROM permits WHERE status IN ('SEDANG_DI_LUAR', 'MENUNGGU_MASUK'))
    ORDER BY r.room_number ASC
  `).all(...params) as Array<{ bca_id: string; full_name: string; room_number: string; class_name: string; gender: Gender }>;
}

export function createBroadcast(accountId: number, input: { title: string; body: string }) {
  const db = getDb();
  const title = input.title.trim().replace(/\s+/g, " ");
  const body = input.body.trim();
  if (title.length < 3 || title.length > 100) return { ok: false, message: "Judul notifikasi harus terdiri dari 3–100 karakter." };
  if (body.length < 5 || body.length > 600) return { ok: false, message: "Isi notifikasi harus terdiri dari 5–600 karakter." };
  const transaction = db.transaction(() => {
    const notification = db.prepare("INSERT INTO broadcast_notifications (title, body, created_by_account_id) VALUES (?, ?, ?)").run(title, body, accountId);
    db.prepare("INSERT INTO notification_deliveries (notification_id, account_id) SELECT ?, id FROM accounts WHERE is_active = 1").run(notification.lastInsertRowid);
    logAudit(accountId, "CREATE_BROADCAST_NOTIFICATION", "broadcast_notification", String(notification.lastInsertRowid));
  });
  transaction();
  const recipients = db.prepare(`
    SELECT full_name, phone_number, email FROM master_residents
    WHERE resident_status = 'ACTIVE' AND (phone_number IS NOT NULL OR email IS NOT NULL)
  `).all() as Array<{ full_name: string; phone_number: string | null; email: string | null }>;
  return { ok: true, message: "Notifikasi berhasil dikirim ke seluruh akun aktif.", recipients, title };
}

export function getBroadcastHistory() {
  return getDb().prepare(`
    SELECT n.id, n.title, n.body, n.created_at, a.full_name AS sender_name,
      COUNT(d.account_id) AS recipient_count,
      SUM(CASE WHEN d.read_at IS NOT NULL THEN 1 ELSE 0 END) AS read_count
    FROM broadcast_notifications n
    JOIN accounts a ON a.id = n.created_by_account_id
    LEFT JOIN notification_deliveries d ON d.notification_id = n.id
    GROUP BY n.id
    ORDER BY n.created_at DESC
    LIMIT 12
  `).all() as Array<{ id: number; title: string; body: string; created_at: string; sender_name: string; recipient_count: number; read_count: number }>;
}

export function deleteBroadcast(actorId: number, notificationId: number) {
  const db = getDb();
  const notification = db.prepare("SELECT id, title FROM broadcast_notifications WHERE id = ?").get(notificationId) as { id: number; title: string } | undefined;
  if (!notification) return { ok: false, message: "Notifikasi tidak ditemukan." };
  const transaction = db.transaction(() => {
    db.prepare("DELETE FROM notification_deliveries WHERE notification_id = ?").run(notificationId);
    db.prepare("DELETE FROM broadcast_notifications WHERE id = ?").run(notificationId);
    logAudit(actorId, "DELETE_BROADCAST_NOTIFICATION", "broadcast_notification", String(notificationId));
  });
  transaction();
  return { ok: true, message: `Notifikasi "${notification.title}" berhasil dihapus dari seluruh akun.` };
}

// Yearly cleanup: wipe exit/entry history (and, for the all-classes case,
// broadcast notifications too) after the manager has archived a report.
// Accounts, master data, and audit log are never touched.
export function resetHistory(actorId: number, className?: string) {
  const db = getDb();
  const transaction = db.transaction(() => {
    if (className) {
      const permitEvents = db.prepare(`
        DELETE FROM permit_events WHERE permit_id IN (
          SELECT p.id FROM permits p JOIN master_residents r ON r.id = p.resident_id WHERE r.class_name = ?
        )
      `).run(className).changes;
      const permits = db.prepare(`DELETE FROM permits WHERE resident_id IN (SELECT id FROM master_residents WHERE class_name = ?)`).run(className).changes;
      logAudit(actorId, "RESET_HISTORY_CLASS", "class", className);
      return { permitEvents, permits, notificationDeliveries: 0, broadcastNotifications: 0 };
    }
    const permitEvents = db.prepare("DELETE FROM permit_events").run().changes;
    const permits = db.prepare("DELETE FROM permits").run().changes;
    const notificationDeliveries = db.prepare("DELETE FROM notification_deliveries").run().changes;
    const broadcastNotifications = db.prepare("DELETE FROM broadcast_notifications").run().changes;
    logAudit(actorId, "RESET_HISTORY_ALL", "system", "all");
    return { permitEvents, permits, notificationDeliveries, broadcastNotifications };
  });
  const counts = transaction();
  return {
    ok: true,
    message: className
      ? `Riwayat keluar-masuk kelas ${className} berhasil dihapus (${counts.permits} izin).`
      : `Riwayat keluar-masuk & notifikasi seluruh sistem berhasil dihapus (${counts.permits} izin).`,
  };
}

export function getNotifications(accountId: number) {
  const db = getDb();
  const notifications = db.prepare(`
    SELECT n.id, n.title, n.body, n.created_at, a.full_name AS sender_name, d.read_at
    FROM notification_deliveries d
    JOIN broadcast_notifications n ON n.id = d.notification_id
    JOIN accounts a ON a.id = n.created_by_account_id
    WHERE d.account_id = ?
    ORDER BY n.created_at DESC
    LIMIT 20
  `).all(accountId) as Array<{ id: number; title: string; body: string; created_at: string; sender_name: string; read_at: string | null }>;
  return { notifications, unread: notifications.filter((item) => !item.read_at).length };
}

export function markNotificationsRead(accountId: number) {
  getDb().prepare("UPDATE notification_deliveries SET read_at = CURRENT_TIMESTAMP WHERE account_id = ? AND read_at IS NULL").run(accountId);
}

function logAudit(actorId: number, action: string, entityType: string, entityId: string) {
  getDb().prepare("INSERT INTO audit_logs (actor_account_id, action, entity_type, entity_id) VALUES (?, ?, ?, ?)").run(actorId, action, entityType, entityId);
}

function normalizeBcaId(value: string) { return value.trim().toUpperCase(); }
function normalizeName(value: string) { return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("id-ID"); }
function normalizeRoom(value: string) { return value.trim().replace(/\s+/g, "").toUpperCase(); }

// Stores Indonesian phone numbers in international format (62xxxxxxxxxx,
// no leading +) since that is what a WhatsApp JID needs downstream.
export function normalizePhoneNumber(value: string | undefined): string | null {
  if (!value?.trim()) return null;
  const digits = value.trim().replace(/[^\d+]/g, "").replace(/^\+/, "");
  const withCountryCode = digits.startsWith("0") ? `62${digits.slice(1)}` : digits;
  return /^62\d{8,13}$/.test(withCountryCode) ? withCountryCode : null;
}

export function normalizeEmail(value: string | undefined): string | null {
  if (!value?.trim()) return null;
  const email = value.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}
