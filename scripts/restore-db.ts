// Restores the live database from a backup snapshot — either one of the
// automatic daily copies in data/backups/, or a file downloaded via the
// "Unduh backup" button in Pengaturan. Run with the app stopped (the WAL
// files it deletes belong to a live connection).
//
// Usage: pnpm tsx scripts/restore-db.ts <path-to-backup.db>

import fs from "node:fs";
import path from "node:path";

const source = process.argv[2];
if (!source) {
  console.error("Pemakaian: pnpm tsx scripts/restore-db.ts <path-ke-backup.db>");
  process.exit(1);
}
if (!fs.existsSync(source)) {
  console.error(`File backup tidak ditemukan: ${source}`);
  process.exit(1);
}

const configured = process.env.DATABASE_URL?.replace(/^file:/, "");
const filePath = configured ? path.resolve(configured) : path.join(process.cwd(), "data", "sikat.db");

for (const suffix of ["", "-wal", "-shm"]) {
  const target = `${filePath}${suffix}`;
  if (fs.existsSync(target)) fs.rmSync(target);
}
fs.copyFileSync(source, filePath);

console.log(`Database dipulihkan dari ${source} ke ${filePath}`);
