import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const configured = process.env.DATABASE_URL?.replace(/^file:/, "");
const filePath = configured ? path.resolve(configured) : path.join(process.cwd(), "data", "sikat.db");

if (!fs.existsSync(filePath)) {
  console.log(`Database tidak ditemukan: ${filePath}`);
  process.exit(0);
}

const db = new Database(filePath);
db.pragma("journal_mode = WAL");

const counts = db.transaction(() => ({
  permitEvents: db.prepare("DELETE FROM permit_events").run().changes,
  permits: db.prepare("DELETE FROM permits").run().changes,
  notificationDeliveries: db.prepare("DELETE FROM notification_deliveries").run().changes,
  broadcastNotifications: db.prepare("DELETE FROM broadcast_notifications").run().changes,
}))();

db.close();

console.log(`Riwayat keluar-masuk & notifikasi dihapus dari: ${filePath}`);
console.log(`  permit_events: ${counts.permitEvents}`);
console.log(`  permits: ${counts.permits}`);
console.log(`  notification_deliveries: ${counts.notificationDeliveries}`);
console.log(`  broadcast_notifications: ${counts.broadcastNotifications}`);
console.log("Akun, master penghuni, satpam, dan audit log tidak diubah.");
