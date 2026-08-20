import fs from "node:fs";
import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { createBackupSnapshot } from "@/lib/db";

export async function GET() {
  await requireRole("MANAGER");
  const snapshotPath = await createBackupSnapshot();
  try {
    const buffer = fs.readFileSync(snapshotPath);
    const filename = `sikat-rtb-backup-${new Date().toISOString().slice(0, 10)}.db`;
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.sqlite3",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } finally {
    fs.rmSync(snapshotPath, { force: true });
  }
}
