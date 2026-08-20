import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { currentPermitCode, getStudentData } from "@/lib/db";
import { generateQrSvg } from "@/lib/qr";

// Polled every ~15s by ActivePermitCard to keep the displayed QR/kode in
// sync with what getPermitForSecurity will actually accept right now — the
// code rotates on that same interval (see currentPermitCode in lib/db.ts).
export async function GET() {
  const session = await requireRole("STUDENT");
  const permit = getStudentData(session.accountId)?.activePermit;
  const code = permit ? currentPermitCode(permit) : null;
  if (!code) return NextResponse.json({ code: null, qr: null }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  const qr = await generateQrSvg(code);
  return NextResponse.json({ code, qr }, { headers: { "Cache-Control": "no-store, max-age=0" } });
}
