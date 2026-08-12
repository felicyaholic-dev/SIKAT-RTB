import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getNotifications, markNotificationsRead } from "@/lib/db";

export async function GET() {
  const session = await requireSession();
  return NextResponse.json(getNotifications(session.accountId));
}

export async function POST() {
  const session = await requireSession();
  markNotificationsRead(session.accountId);
  return NextResponse.json({ ok: true });
}
