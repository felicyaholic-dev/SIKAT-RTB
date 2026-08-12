import "server-only";

import bcrypt from "bcryptjs";
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

export type Role = "STUDENT" | "SECURITY" | "MANAGER";
export type PermitStatus = "MENUNGGU_KELUAR" | "SEDANG_DI_LUAR" | "MENUNGGU_MASUK" | "SELESAI" | "DIBATALKAN";
export type Gender = "LAKI_LAKI" | "PEREMPUAN" | "TIDAK_DISEBUTKAN";
export type ReportPeriod = "DAY" | "WEEK" | "MONTH";

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
      shift_label TEXT NOT NULL DEFAULT 'Belum ditetapkan',
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
  ensureColumn(database, "security_staff", "gender", "TEXT NOT NULL DEFAULT 'TIDAK_DISEBUTKAN'");
  ensureColumn(database, "permits", "entry_code", "TEXT");
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
  entry_code: string | null;
  status: PermitStatus;
  created_at: string;
};

export function createPermit(accountId: number, input: { destination?: string; departure?: string; returnAt?: string }) {
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
  if (!input.destination?.trim() || !input.departure) throw new Error("Lengkapi tujuan dan waktu keluar.");
  const permitCode = `SKT-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  const qrToken = crypto.randomUUID();
  const result = db.prepare(`
    INSERT INTO permits (resident_id, permit_code, qr_token, destination, planned_departure_at, planned_return_at, status)
    VALUES (?, ?, ?, ?, ?, ?, 'MENUNGGU_KELUAR')
  `).run(resident.id, permitCode, qrToken, input.destination.trim(), input.departure, input.departure);
  db.prepare("INSERT INTO permit_events (permit_id, event_type, performed_by_account_id) VALUES (?, 'EXIT_REQUESTED', ?)").run(result.lastInsertRowid, accountId);
  return { code: permitCode, mode: "EXIT" as const };
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

export function validatePermit(accountId: number, permitId: number) {
  const db = getDb();
  const permit = db.prepare("SELECT * FROM permits WHERE id = ?").get(permitId) as PermitRow | undefined;
  if (!permit) return { ok: false, message: "Izin tidak ditemukan." };
  const event = permit.status === "MENUNGGU_KELUAR" ? "EXIT" : permit.status === "MENUNGGU_MASUK" ? "ENTRY" : null;
  if (!event) return { ok: false, message: "QR ini sudah digunakan atau belum siap divalidasi." };
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
  return db.prepare(`
    SELECT p.*, r.full_name, r.room_number FROM permits p
    JOIN master_residents r ON r.id = p.resident_id
    WHERE p.status IN ('SEDANG_DI_LUAR','MENUNGGU_MASUK') ORDER BY p.planned_departure_at ASC
  `).all() as Array<PermitRow & { full_name: string; room_number: string }>;
}

export function getManagerData() {
  const db = getDb();
  const stats = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM master_residents WHERE resident_status = 'ACTIVE') AS residents,
      (SELECT COUNT(*) FROM permits WHERE status IN ('SEDANG_DI_LUAR', 'MENUNGGU_MASUK')) AS outside,
      (SELECT COUNT(*) FROM permits WHERE date(created_at) = date('now')) AS today
  `).get() as { residents: number; outside: number; today: number };
  const watchlist = getSecurityQueue();
  const activityRows = db.prepare(`
    SELECT date(occurred_at, 'localtime') AS day,
      SUM(CASE WHEN event_type = 'EXIT' THEN 1 ELSE 0 END) AS exits,
      SUM(CASE WHEN event_type = 'ENTRY' THEN 1 ELSE 0 END) AS entries
    FROM permit_events
    WHERE event_type IN ('EXIT', 'ENTRY') AND date(occurred_at, 'localtime') >= date('now', '-6 days', 'localtime')
    GROUP BY date(occurred_at, 'localtime')
  `).all() as Array<{ day: string; exits: number; entries: number }>;
  const activityByDay = new Map(activityRows.map((item) => [item.day, item]));
  const weeklyActivity = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    const day = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const values = activityByDay.get(day);
    return { label: new Intl.DateTimeFormat("id-ID", { weekday: "short" }).format(date).replace(".", ""), exits: values?.exits || 0, entries: values?.entries || 0 };
  });
  const residents = db.prepare(`
    SELECT r.*, CASE WHEN a.id IS NULL THEN 'Belum aktif' ELSE 'Aktif' END AS account_status
    FROM master_residents r LEFT JOIN accounts a ON a.resident_id = r.id
    ORDER BY r.full_name ASC
  `).all() as Array<ResidentRow & { account_status: string }>;
  const securityStaff = db.prepare("SELECT * FROM security_staff ORDER BY full_name ASC").all() as Array<{ id: number; bca_id: string; full_name: string; shift_label: string; gender: Gender; staff_status: string }>;
  return { stats, watchlist, weeklyActivity, residents, securityStaff };
}

export function addResident(actorId: number, input: { bcaId: string; fullName: string; room: string; className: string; gender: Gender; password: string }) {
  const db = getDb();
  const bcaId = normalizeBcaId(input.bcaId);
  if (!/^\d{6}$/.test(bcaId)) return { ok: false, message: "ID BCA mahasiswa harus terdiri dari 6 angka." };
  try {
    const transaction = db.transaction(() => {
      const resident = db.prepare("INSERT INTO master_residents (bca_id, full_name, room_number, class_name, gender) VALUES (?, ?, ?, ?, ?)").run(bcaId, input.fullName.trim(), input.room.trim().toUpperCase(), input.className.trim(), input.gender);
      const account = db.prepare("INSERT INTO accounts (resident_id, bca_id, full_name, role, password_hash, must_change_password) VALUES (?, ?, ?, 'STUDENT', ?, 1)").run(resident.lastInsertRowid, bcaId, input.fullName.trim(), bcrypt.hashSync(input.password, 12));
      logAudit(actorId, "CREATE_STUDENT_ACCOUNT", "account", String(account.lastInsertRowid));
    });
    transaction();
    return { ok: true, message: "Akun mahasiswa berhasil dibuat. User wajib mengganti password saat login pertama." };
  } catch {
    return { ok: false, message: "ID BCA sudah terdaftar atau data tidak valid." };
  }
}

export function addSecurityStaff(actorId: number, input: { bcaId: string; fullName: string; shiftLabel: string; gender: Gender; password: string }) {
  const db = getDb();
  const bcaId = normalizeBcaId(input.bcaId);
  if (!/^\d{6}$/.test(bcaId)) return { ok: false, message: "ID BCA satpam harus terdiri dari 6 angka." };
  try {
    const transaction = db.transaction(() => {
      db.prepare("INSERT INTO security_staff (bca_id, full_name, shift_label, gender) VALUES (?, ?, ?, ?)").run(bcaId, input.fullName.trim(), input.shiftLabel.trim(), input.gender);
      db.prepare("INSERT INTO accounts (bca_id, full_name, role, password_hash, must_change_password) VALUES (?, ?, 'SECURITY', ?, 1)").run(bcaId, input.fullName.trim(), bcrypt.hashSync(input.password, 12));
    });
    transaction();
    logAudit(actorId, "CREATE_SECURITY_STAFF", "security_staff", bcaId);
    return { ok: true, message: "Akun satpam berhasil dibuat." };
  } catch { return { ok: false, message: "ID BCA satpam sudah digunakan atau data tidak valid." }; }
}

export function updateSecurityStaff(actorId: number, input: { id: number; fullName: string; shiftLabel: string; gender: Gender; staffStatus: "ACTIVE" | "INACTIVE" }) {
  const db = getDb();
  const staff = db.prepare("SELECT bca_id FROM security_staff WHERE id = ?").get(input.id) as { bca_id: string } | undefined;
  if (!staff) return { ok: false, message: "Data satpam tidak ditemukan." };
  db.prepare("UPDATE security_staff SET full_name = ?, shift_label = ?, gender = ?, staff_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(input.fullName.trim(), input.shiftLabel.trim(), input.gender, input.staffStatus, input.id);
  db.prepare("UPDATE accounts SET full_name = ?, is_active = ? WHERE bca_id = ? AND role = 'SECURITY'").run(input.fullName.trim(), input.staffStatus === "ACTIVE" ? 1 : 0, staff.bca_id);
  logAudit(actorId, "UPDATE_SECURITY_STAFF", "security_staff", String(input.id));
  return { ok: true, message: input.staffStatus === "INACTIVE" ? "Satpam dinonaktifkan dan aksesnya dicabut." : "Data satpam diperbarui." };
}

export function updateResident(actorId: number, input: { id: number; fullName: string; room: string; className: string; gender: Gender; residentStatus: "ACTIVE" | "INACTIVE" }) {
  const db = getDb();
  const resident = db.prepare("SELECT id FROM master_residents WHERE id = ?").get(input.id);
  if (!resident) return { ok: false, message: "Data penghuni tidak ditemukan." };
  db.prepare(`
    UPDATE master_residents SET full_name = ?, room_number = ?, class_name = ?, gender = ?, resident_status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(input.fullName.trim(), input.room.trim().toUpperCase(), input.className.trim(), input.gender, input.residentStatus, input.id);
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
  DAY: "date(p.created_at, 'localtime') = date('now', 'localtime')",
  WEEK: "date(p.created_at, 'localtime') >= date('now', '-6 days', 'localtime')",
  MONTH: "date(p.created_at, 'localtime') >= date('now', 'start of month', 'localtime')",
};

export function getReport(period: ReportPeriod) {
  const db = getDb();
  const where = reportPeriodWhere[period];
  const rows = db.prepare(`
    SELECT p.permit_code, p.entry_code, r.bca_id, r.full_name, r.room_number, p.destination,
      p.planned_departure_at, p.planned_return_at, p.status, p.created_at,
      MAX(CASE WHEN e.event_type = 'EXIT' THEN e.occurred_at END) AS actual_exit_at,
      MAX(CASE WHEN e.event_type = 'ENTRY' THEN e.occurred_at END) AS actual_entry_at
    FROM permits p
    JOIN master_residents r ON r.id = p.resident_id
    LEFT JOIN permit_events e ON e.permit_id = p.id
    WHERE ${where}
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `).all() as Array<Record<string, string | null>>;
  const activity = db.prepare(`
    SELECT
      SUM(CASE WHEN e.event_type = 'EXIT' THEN 1 ELSE 0 END) AS exits,
      SUM(CASE WHEN e.event_type = 'ENTRY' THEN 1 ELSE 0 END) AS entries
    FROM permit_events e
    JOIN permits p ON p.id = e.permit_id
    WHERE ${where}
  `).get() as { exits: number | null; entries: number | null };
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
  return { ok: true, message: "Notifikasi berhasil dikirim ke seluruh akun aktif." };
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
