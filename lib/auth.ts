import "server-only";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { isAccountActive, type Role } from "@/lib/db";

const COOKIE_NAME = "sikat_session";

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET environment variable is required.");
}
const secret = new TextEncoder().encode(process.env.SESSION_SECRET);

export type Session = { accountId: number; bcaId: string; name: string; role: Role; room?: string | null; mustChangePassword?: boolean };

export async function createSession(session: Session) {
  const token = await new SignJWT(session)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret);
  const store = await cookies();
  store.set(COOKIE_NAME, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 8 });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    const session = payload as unknown as Session;
    // A valid, unexpired JWT alone isn't enough — the account may have been
    // deactivated since it was issued, and that revocation needs to take
    // effect immediately rather than waiting out the token's 8h lifetime.
    if (!isAccountActive(session.accountId)) return null;
    return session;
  } catch {
    return null;
  }
}

export async function requireRole(...roles: Role[]) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.mustChangePassword) redirect("/change-password");
  if (!roles.includes(session.role)) redirect(roleHome(session.role));
  return session;
}

export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

// Railway (and every PaaS proxy) terminates TLS in front of the app, so the
// real client address only survives in X-Forwarded-For — req.socket-style
// APIs aren't available to a server action anyway. Takes the first hop
// (closest to the client) and falls back to X-Real-IP for setups that use it
// instead; if neither is set (e.g. running bare, no proxy), rate limiting
// degrades to per-bcaId only, same as before this existed.
export async function getClientIp(): Promise<string> {
  const store = await headers();
  const forwardedFor = store.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return store.get("x-real-ip") || "unknown";
}

export function roleHome(role: Role) {
  return role === "STUDENT" ? "/student" : role === "SECURITY" ? "/security" : "/manager";
}
