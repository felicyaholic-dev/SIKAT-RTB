import "server-only";

import bcrypt from "bcryptjs";
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

export type Role = "STUDENT" | "SECURITY" | "MANAGER";
export type PermitStatus = "MENUNGGU_KELUAR" | "SEDANG_DI_LUAR" | "TERLAMBAT" | "SELESAI" | "DIBATALKAN";

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
  resident_status: string;
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
      shift_label TEXT NOT NULL DEFAULT 'Belum ditetapkan',
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
      planned_departure_at TEXT NOT NULL,
      planned_return_at TEXT NOT NULL,
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
  `);
  ensureColumn(database, "accounts", "must_change_password", "INTEGER NOT NULL DEFAULT 0");
  migrateLegacyDemoIds(database);
  seed(database);
  return database;
}

// Bootstraps exactly one manager account from environment variables, so a
// fresh deployment has a way in without any credentials baked into source
// control. No-ops once a manager already exists, and no-ops entirely if the
// bootstrap variables aren't set — there is no seeded/demo data otherwise.
function seed(db: Database.Database) {
  const hasManager = db.prepare("SELECT id FROM accounts WHERE role = 'MANAGER' LIMIT 1").get();
  if (hasManager) return;
  const bcaId = process.env.INITIAL_MANAGER_BCA_ID;
  const password = process.env.INITIAL_MANAGER_PASSWORD;
  if (!bcaId || !password) return;
  const fullName = process.env.INITIAL_MANAGER_NAME || "Pengelola RTB";
  db.prepare(
    "INSERT OR IGNORE INTO accounts (bca_id, full_name, role, password_hash) VALUES (?, ?, 'MANAGER', ?)",
  ).run(normalizeBcaId(bcaId), fullName, bcrypt.hashSync(password, 12));
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
  refreshOverdue(db);
  const activePermit = db.prepare(`
    SELECT * FROM permits WHERE resident_id = ? AND status IN ('MENUNGGU_KELUAR','SEDANG_DI_LUAR','TERLAMBAT')
    ORDER BY created_at DESC LIMIT 1
  `).get(resident.id) as PermitRow | undefined;
  const history = db.prepare(`
    SELECT * FROM permits WHERE resident_id = ? ORDER BY created_at DESC LIMIT 5
  `).all(resident.id) as PermitRow[];
  return { resident, activePermit, history };
}

type PermitRow = {
  id: number;
  resident_id: number;
  permit_code: string;
  qr_token: string;
  destination: string;
  planned_departure_at: string;
  planned_return_at: string;
  status: PermitStatus;
  created_at: string;
};

export function createPermit(accountId: number, input: { destination: string; departure: string; returnAt: string }) {
  const db = getDb();
  const resident = db.prepare("SELECT r.* FROM master_residents r JOIN accounts a ON a.resident_id = r.id WHERE a.id = ?").get(accountId) as ResidentRow | undefined;
  if (!resident) throw new Error("Profil mahasiswa tidak ditemukan.");
  const current = db.prepare("SELECT id FROM permits WHERE resident_id = ? AND status IN ('MENUNGGU_KELUAR','SEDANG_DI_LUAR','TERLAMBAT')").get(resident.id);
  if (current) throw new Error("Masih ada izin aktif. Selesaikan atau batalkan izin tersebut terlebih dahulu.");
  const permitCode = `SKT-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  const qrToken = crypto.randomUUID();
  const result = db.prepare(`
    INSERT INTO permits (resident_id, permit_code, qr_token, destination, planned_departure_at, planned_return_at, status)
    VALUES (?, ?, ?, ?, ?, ?, 'MENUNGGU_KELUAR')
  `).run(resident.id, permitCode, qrToken, input.destination.trim(), input.departure, input.returnAt);
  db.prepare("INSERT INTO permit_events (permit_id, event_type, performed_by_account_id) VALUES (?, 'SUBMITTED', ?)").run(result.lastInsertRowid, accountId);
  return permitCode;
}

export function getPermitForSecurity(code: string) {
  const db = getDb();
  refreshOverdue(db);
  return db.prepare(`
    SELECT p.*, r.full_name, r.room_number, r.class_name
    FROM permits p JOIN master_residents r ON r.id = p.resident_id
    WHERE p.permit_code = ? OR p.qr_token = ?
  `).get(code.trim().toUpperCase(), code.trim()) as (PermitRow & { full_name: string; room_number: string; class_name: string }) | undefined;
}

export function validatePermit(accountId: number, permitId: number, event: "EXIT" | "ENTRY") {
  const db = getDb();
  refreshOverdue(db);
  const permit = db.prepare("SELECT * FROM permits WHERE id = ?").get(permitId) as PermitRow | undefined;
  if (!permit) return { ok: false, message: "Izin tidak ditemukan." };
  const allowed = event === "EXIT" ? permit.status === "MENUNGGU_KELUAR" : ["SEDANG_DI_LUAR", "TERLAMBAT"].includes(permit.status);
  if (!allowed) return { ok: false, message: "Status izin tidak dapat divalidasi untuk aksi ini." };
  const next = event === "EXIT" ? "SEDANG_DI_LUAR" : "SELESAI";
  const transaction = db.transaction(() => {
    db.prepare("UPDATE permits SET status = ? WHERE id = ?").run(next, permitId);
    db.prepare("INSERT INTO permit_events (permit_id, event_type, performed_by_account_id) VALUES (?, ?, ?)").run(permitId, event, accountId);
  });
  transaction();
  return { ok: true, message: event === "EXIT" ? "Keluar tercatat. Mahasiswa kini berstatus di luar RTB." : "Masuk tercatat. Izin selesai." };
}

export function getSecurityQueue() {
  const db = getDb();
  refreshOverdue(db);
  return db.prepare(`
    SELECT p.*, r.full_name, r.room_number FROM permits p
    JOIN master_residents r ON r.id = p.resident_id
    WHERE p.status IN ('SEDANG_DI_LUAR','TERLAMBAT') ORDER BY p.planned_return_at ASC
  `).all() as Array<PermitRow & { full_name: string; room_number: string }>;
}

export function getManagerData() {
  const db = getDb();
  refreshOverdue(db);
  const stats = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM master_residents WHERE resident_status = 'ACTIVE') AS residents,
      (SELECT COUNT(*) FROM permits WHERE status = 'SEDANG_DI_LUAR') AS outside,
      (SELECT COUNT(*) FROM permits WHERE status = 'TERLAMBAT') AS overdue,
      (SELECT COUNT(*) FROM permits WHERE date(created_at) = date('now')) AS today
  `).get() as { residents: number; outside: number; overdue: number; today: number };
  const watchlist = getSecurityQueue();
  const residents = db.prepare(`
    SELECT r.*, CASE WHEN a.id IS NULL THEN 'Belum aktif' ELSE 'Aktif' END AS account_status
    FROM master_residents r LEFT JOIN accounts a ON a.resident_id = r.id
    ORDER BY r.full_name ASC
  `).all() as Array<ResidentRow & { account_status: string }>;
  const securityStaff = db.prepare("SELECT * FROM security_staff ORDER BY full_name ASC").all() as Array<{ id: number; bca_id: string; full_name: string; shift_label: string; staff_status: string }>;
  return { stats, watchlist, residents, securityStaff };
}

export function addResident(actorId: number, input: { bcaId: string; fullName: string; room: string; className: string; password: string }) {
  const db = getDb();
  const bcaId = normalizeBcaId(input.bcaId);
  if (!/^\d{6}$/.test(bcaId)) return { ok: false, message: "ID BCA mahasiswa harus terdiri dari 6 angka." };
  try {
    const transaction = db.transaction(() => {
      const resident = db.prepare("INSERT INTO master_residents (bca_id, full_name, room_number, class_name) VALUES (?, ?, ?, ?)").run(bcaId, input.fullName.trim(), input.room.trim().toUpperCase(), input.className.trim());
      const account = db.prepare("INSERT INTO accounts (resident_id, bca_id, full_name, role, password_hash, must_change_password) VALUES (?, ?, ?, 'STUDENT', ?, 1)").run(resident.lastInsertRowid, bcaId, input.fullName.trim(), bcrypt.hashSync(input.password, 12));
      logAudit(actorId, "CREATE_STUDENT_ACCOUNT", "account", String(account.lastInsertRowid));
    });
    transaction();
    return { ok: true, message: "Akun mahasiswa berhasil dibuat. User wajib mengganti password saat login pertama." };
  } catch {
    return { ok: false, message: "ID BCA sudah terdaftar atau data tidak valid." };
  }
}

export function addSecurityStaff(actorId: number, input: { bcaId: string; fullName: string; shiftLabel: string; password: string }) {
  const db = getDb();
  const bcaId = normalizeBcaId(input.bcaId);
  if (!/^\d{6}$/.test(bcaId)) return { ok: false, message: "ID BCA satpam harus terdiri dari 6 angka." };
  try {
    const transaction = db.transaction(() => {
      db.prepare("INSERT INTO security_staff (bca_id, full_name, shift_label) VALUES (?, ?, ?)").run(bcaId, input.fullName.trim(), input.shiftLabel.trim());
      db.prepare("INSERT INTO accounts (bca_id, full_name, role, password_hash, must_change_password) VALUES (?, ?, 'SECURITY', ?, 1)").run(bcaId, input.fullName.trim(), bcrypt.hashSync(input.password, 12));
    });
    transaction();
    logAudit(actorId, "CREATE_SECURITY_STAFF", "security_staff", bcaId);
    return { ok: true, message: "Akun satpam berhasil dibuat." };
  } catch { return { ok: false, message: "ID BCA satpam sudah digunakan atau data tidak valid." }; }
}

export function updateSecurityStaff(actorId: number, input: { id: number; fullName: string; shiftLabel: string; staffStatus: "ACTIVE" | "INACTIVE" }) {
  const db = getDb();
  const staff = db.prepare("SELECT bca_id FROM security_staff WHERE id = ?").get(input.id) as { bca_id: string } | undefined;
  if (!staff) return { ok: false, message: "Data satpam tidak ditemukan." };
  db.prepare("UPDATE security_staff SET full_name = ?, shift_label = ?, staff_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(input.fullName.trim(), input.shiftLabel.trim(), input.staffStatus, input.id);
  db.prepare("UPDATE accounts SET full_name = ?, is_active = ? WHERE bca_id = ? AND role = 'SECURITY'").run(input.fullName.trim(), input.staffStatus === "ACTIVE" ? 1 : 0, staff.bca_id);
  logAudit(actorId, "UPDATE_SECURITY_STAFF", "security_staff", String(input.id));
  return { ok: true, message: input.staffStatus === "INACTIVE" ? "Satpam dinonaktifkan dan aksesnya dicabut." : "Data satpam diperbarui." };
}

export function updateResident(actorId: number, input: { id: number; fullName: string; room: string; className: string; residentStatus: "ACTIVE" | "INACTIVE" }) {
  const db = getDb();
  const resident = db.prepare("SELECT id FROM master_residents WHERE id = ?").get(input.id);
  if (!resident) return { ok: false, message: "Data penghuni tidak ditemukan." };
  db.prepare(`
    UPDATE master_residents SET full_name = ?, room_number = ?, class_name = ?, resident_status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(input.fullName.trim(), input.room.trim().toUpperCase(), input.className.trim(), input.residentStatus, input.id);
  if (input.residentStatus === "INACTIVE") {
    db.prepare("UPDATE accounts SET is_active = 0 WHERE resident_id = ?").run(input.id);
  }
  logAudit(actorId, "UPDATE_RESIDENT", "master_resident", String(input.id));
  return { ok: true, message: input.residentStatus === "INACTIVE" ? "Penghuni dinonaktifkan dan akses akunnya dicabut." : "Data penghuni berhasil diperbarui." };
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

export function getDailyReport() {
  const db = getDb();
  refreshOverdue(db);
  return db.prepare(`
    SELECT p.permit_code, r.bca_id, r.full_name, r.room_number, p.destination,
      p.planned_departure_at, p.planned_return_at, p.status, p.created_at,
      MAX(CASE WHEN e.event_type = 'EXIT' THEN e.occurred_at END) AS actual_exit_at,
      MAX(CASE WHEN e.event_type = 'ENTRY' THEN e.occurred_at END) AS actual_entry_at
    FROM permits p
    JOIN master_residents r ON r.id = p.resident_id
    LEFT JOIN permit_events e ON e.permit_id = p.id
    WHERE date(p.created_at) = date('now')
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `).all() as Array<Record<string, string | null>>;
}

function refreshOverdue(db: Database.Database) {
  db.prepare(`
    UPDATE permits SET status = 'TERLAMBAT'
    WHERE status = 'SEDANG_DI_LUAR' AND datetime(planned_return_at) < datetime('now')
  `).run();
}

function logAudit(actorId: number, action: string, entityType: string, entityId: string) {
  getDb().prepare("INSERT INTO audit_logs (actor_account_id, action, entity_type, entity_id) VALUES (?, ?, ?, ?)").run(actorId, action, entityType, entityId);
}

function normalizeBcaId(value: string) { return value.trim().toUpperCase(); }
function normalizeName(value: string) { return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("id-ID"); }
function normalizeRoom(value: string) { return value.trim().replace(/\s+/g, "").toUpperCase(); }
