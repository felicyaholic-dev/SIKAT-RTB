import "server-only";

import ExcelJS from "exceljs";

export type ResidentImportRow = {
  bcaId: string;
  fullName: string;
  room: string;
  className: string;
  gender: string;
  password: string;
  phoneNumber?: string;
  email?: string;
};

function pickField(record: Record<string, string>, ...aliases: string[]) {
  const keys = Object.keys(record);
  for (const alias of aliases) {
    const key = keys.find((k) => k.toLowerCase() === alias.toLowerCase());
    if (key) return record[key];
  }
  return "";
}

// Reads the first worksheet only. Column order doesn't matter — headers on
// row 1 are matched case-insensitively against the aliases below, so a
// template exported from the manager's own recap Excel still works.
export async function parseResidentSheet(buffer: ArrayBuffer): Promise<ResidentImportRow[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) return [];

  let headers: string[] = [];
  const rows: ResidentImportRow[] = [];
  worksheet.eachRow((row, rowNumber) => {
    const values = row.values as ExcelJS.CellValue[];
    if (rowNumber === 1) {
      headers = values.slice(1).map((value) => String(value ?? "").trim());
      return;
    }
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      const cell = values[index + 1];
      record[header] = cell === undefined || cell === null ? "" : String(cell).trim();
    });
    if (Object.values(record).every((value) => !value)) return;
    rows.push({
      bcaId: pickField(record, "ID BCA", "IDBCA"),
      fullName: pickField(record, "Nama Lengkap", "Nama"),
      room: pickField(record, "Kamar", "Nomor Kamar"),
      className: pickField(record, "Kelas"),
      gender: pickField(record, "Jenis Kelamin", "Gender", "L/P"),
      password: pickField(record, "Password Awal", "Password"),
      phoneNumber: pickField(record, "Nomor WA", "No WA", "WhatsApp", "Nomor HP") || undefined,
      email: pickField(record, "Email", "Alamat Email", "E-mail") || undefined,
    });
  });
  return rows;
}
