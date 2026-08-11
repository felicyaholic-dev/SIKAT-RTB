import fs from "node:fs";
import path from "node:path";

const configured = process.env.DATABASE_URL?.replace(/^file:/, "");
const filePath = configured ? path.resolve(configured) : path.join(process.cwd(), "data", "sikat.db");

for (const suffix of ["", "-wal", "-shm"]) {
  const target = `${filePath}${suffix}`;
  if (fs.existsSync(target)) fs.rmSync(target);
}

console.log(`Database reset: ${filePath}`);
