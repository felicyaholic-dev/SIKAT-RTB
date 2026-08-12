import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { getReport, type ReportPeriod } from "@/lib/db";

function cell(value: string | null | undefined) {
  const text = value ?? "";
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET(request: Request) {
  await requireRole("MANAGER");
  const periodParam = new URL(request.url).searchParams.get("period");
  const period: ReportPeriod = ["DAY", "WEEK", "MONTH"].includes(periodParam || "") ? periodParam as ReportPeriod : "DAY";
  const rows = getReport(period).rows;
  const header = ["Kode QR keluar", "Kode QR masuk", "ID BCA", "Nama", "Kamar", "Jenis izin", "Keterangan", "Waktu keluar (form)", "Waktu kembali (form)", "Keluar tervalidasi", "Masuk tervalidasi", "Status"];
  const csv = [header.map(cell).join(","), ...rows.map((row) => [row.permit_code, row.entry_code, row.bca_id, row.full_name, row.room_number, row.permit_type, row.destination, row.planned_departure_at, row.planned_return_at, row.actual_exit_at, row.actual_entry_at, row.status].map(cell).join(","))].join("\n");
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Makassar" }).format(new Date());
  return new NextResponse(`\uFEFF${csv}`, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="laporan-sikat-${period.toLowerCase()}-${date}.csv"` } });
}
