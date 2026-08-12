import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { getStudentPermitDecision } from "@/lib/db";

export async function GET() {
  const session = await requireRole("STUDENT");
  return NextResponse.json(
    { decision: getStudentPermitDecision(session.accountId) },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
