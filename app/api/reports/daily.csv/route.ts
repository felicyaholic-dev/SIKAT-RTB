import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { getReport, getResidentsInside, type ReportPeriod } from "@/lib/db";
import { RESIDENT_CLASSES } from "@/lib/ui";

function cell(value: string | null | undefined) {
  let text = value ?? "";
  // Neutralize CSV/formula injection: Excel/Sheets treats a cell starting
  // with =, +, -, or @ as a formula when the file is opened. "Keterangan"
  // (destination) is free text a student types themselves, so this is
  // reachable by untrusted input — prefixing an apostrophe forces it to be
  // read as literal text instead.
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

function toCsv(header: string[], rows: Array<Array<string | null | undefined>>) {
  return [header.map(cell).join(","), ...rows.map((row) => row.map(cell).join(","))].join("\n");
}

export async function GET(request: Request) {
  await requireRole("MANAGER");
  const params = new URL(request.url).searchParams;
  const periodParam = params.get("period");
  const period: ReportPeriod = ["DAY", "WEEK", "MONTH", "YEAR", "ALL"].includes(periodParam || "") ? periodParam as ReportPeriod : "DAY";
  const kelasParam = params.get("kelas");
  const kelas = kelasParam && (RESIDENT_CLASSES as readonly string[]).includes(kelasParam) ? kelasParam : undefined;
  const jenis = params.get("jenis") === "didalam" ? "didalam" : "keluar";
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());

  if (jenis === "didalam") {
    const residents = getResidentsInside(kelas);
    const csv = toCsv(
      ["ID BCA", "Nama", "Kamar", "Kelas", "Jenis kelamin"],
      residents.map((r) => [r.bca_id, r.full_name, r.room_number, r.class_name, r.gender]),
    );
    return new NextResponse(`﻿${csv}`, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="penghuni-didalam-rtb-${date}.csv"` } });
  }

  const rows = getReport(period, kelas).rows;
  const header = ["Kode QR keluar", "Kode QR masuk", "ID BCA", "Nama", "Kamar", "Kelas", "Jenis izin", "Keterangan", "Waktu keluar (form)", "Waktu kembali (form)", "Keluar tervalidasi", "Masuk tervalidasi", "Status"];
  const csv = toCsv(header, rows.map((row) => [row.permit_code, row.entry_code, row.bca_id, row.full_name, row.room_number, row.class_name, row.permit_type, row.destination, row.planned_departure_at, row.planned_return_at, row.actual_exit_at, row.actual_entry_at, row.status]));
  return new NextResponse(`﻿${csv}`, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="laporan-sikat-${period.toLowerCase()}-${date}.csv"` } });
}
