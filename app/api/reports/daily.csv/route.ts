import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { getDailyReport } from "@/lib/db";

function cell(value: string | null | undefined) {
  const text = value ?? "";
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET() {
  await requireRole("MANAGER");
  const rows = getDailyReport();
  const header = ["Kode izin", "ID BCA", "Nama", "Kamar", "Tujuan", "Rencana keluar", "Rencana kembali", "Keluar aktual", "Masuk aktual", "Status"];
  const csv = [header.map(cell).join(","), ...rows.map((row) => [row.permit_code, row.bca_id, row.full_name, row.room_number, row.destination, row.planned_departure_at, row.planned_return_at, row.actual_exit_at, row.actual_entry_at, row.status].map(cell).join(","))].join("\n");
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Makassar" }).format(new Date());
  return new NextResponse(`\uFEFF${csv}`, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="laporan-sikat-${date}.csv"` } });
}
