import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

// One-time export: dumps the SQLite database (schema + data) as a MySQL-
// compatible .sql file, for importing into cPanel via phpMyAdmin. This is a
// snapshot, not a live sync — re-run and re-import whenever you want a fresh copy.

const configured = process.env.DATABASE_URL?.replace(/^file:/, "");
const filePath = configured ? path.resolve(configured) : path.join(process.cwd(), "data", "sikat.db");
const outPath = process.argv[2] ? path.resolve(process.argv[2]) : path.join(process.cwd(), "sikat-mysql-export.sql");

const SCHEMA = `
CREATE TABLE IF NOT EXISTS master_residents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bca_id VARCHAR(50) NOT NULL UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  room_number VARCHAR(50) NOT NULL,
  class_name VARCHAR(100) NOT NULL,
  gender VARCHAR(30) NOT NULL DEFAULT 'TIDAK_DISEBUTKAN',
  resident_status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  phone_number VARCHAR(30),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  resident_id INT UNIQUE,
  bca_id VARCHAR(50) NOT NULL UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  must_change_password TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (resident_id) REFERENCES master_residents(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS security_staff (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bca_id VARCHAR(50) NOT NULL UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  gender VARCHAR(30) NOT NULL DEFAULT 'TIDAK_DISEBUTKAN',
  staff_status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS permits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  resident_id INT NOT NULL,
  permit_code VARCHAR(100) NOT NULL UNIQUE,
  qr_token VARCHAR(255) NOT NULL UNIQUE,
  destination VARCHAR(255) NOT NULL,
  permit_type VARCHAR(50) NOT NULL DEFAULT 'IZIN_PRIBADI',
  planned_departure_at DATETIME NOT NULL,
  planned_return_at DATETIME NOT NULL,
  entry_code VARCHAR(50),
  status VARCHAR(30) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (resident_id) REFERENCES master_residents(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS permit_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  permit_id INT NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  performed_by_account_id INT,
  occurred_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (permit_id) REFERENCES permits(id),
  FOREIGN KEY (performed_by_account_id) REFERENCES accounts(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  actor_account_id INT,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(100) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS login_attempts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  identifier VARCHAR(255) NOT NULL,
  action VARCHAR(50) NOT NULL,
  attempted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS manager_bootstrap_links (
  bootstrap_bca_id VARCHAR(50) PRIMARY KEY,
  account_id INT NOT NULL UNIQUE,
  FOREIGN KEY (account_id) REFERENCES accounts(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS broadcast_notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  created_by_account_id INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by_account_id) REFERENCES accounts(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS notification_deliveries (
  notification_id INT NOT NULL,
  account_id INT NOT NULL,
  read_at DATETIME,
  PRIMARY KEY (notification_id, account_id),
  FOREIGN KEY (notification_id) REFERENCES broadcast_notifications(id),
  FOREIGN KEY (account_id) REFERENCES accounts(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

const TABLES = [
  "master_residents",
  "accounts",
  "security_staff",
  "permits",
  "permit_events",
  "audit_logs",
  "login_attempts",
  "manager_bootstrap_links",
  "broadcast_notifications",
  "notification_deliveries",
];

function escapeValue(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number" || typeof value === "bigint") return String(value);
  const text = String(value)
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/\r/g, "\\r")
    .replace(/\n/g, "\\n");
  return `'${text}'`;
}

const db = new Database(filePath, { readonly: true });

let out = "SET FOREIGN_KEY_CHECKS=0;\n" + SCHEMA + "\n";

for (const table of TABLES) {
  const rows = db.prepare(`SELECT * FROM ${table}`).all() as Record<string, unknown>[];
  if (rows.length === 0) continue;
  const columns = Object.keys(rows[0]);
  const columnList = columns.map((c) => `\`${c}\``).join(", ");
  out += `-- ${rows.length} row(s) for ${table}\n`;
  for (const row of rows) {
    const values = columns.map((c) => escapeValue(row[c])).join(", ");
    out += `INSERT INTO \`${table}\` (${columnList}) VALUES (${values});\n`;
  }
  out += "\n";
}

out += "SET FOREIGN_KEY_CHECKS=1;\n";

fs.writeFileSync(outPath, out, "utf8");
db.close();

console.log(`Exported MySQL dump from ${filePath} to ${outPath}`);
