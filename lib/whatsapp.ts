import "server-only";

import fs from "node:fs";
import path from "node:path";
import makeWASocket, { useMultiFileAuthState, type WASocket } from "@whiskeysockets/baileys";
import qrcodeTerminal from "qrcode-terminal";
import { normalizePhoneNumber } from "@/lib/db";

// Reuses the same persistent volume as the SQLite database (mounted at
// DATABASE_URL's directory in production) so the paired session survives
// redeploys instead of needing a new QR scan every time.
function sessionDir() {
  const configured = process.env.DATABASE_URL?.replace(/^file:/, "");
  const dataDir = configured ? path.dirname(path.resolve(configured)) : path.join(process.cwd(), "data");
  return path.join(dataDir, "whatsapp-session");
}

let socket: WASocket | undefined;
let connecting = false;

export async function initWhatsApp() {
  if (process.env.WHATSAPP_ENABLED !== "true") {
    console.log("[whatsapp] WHATSAPP_ENABLED bukan 'true', koneksi WA tidak dimulai.");
    return;
  }
  if (connecting || socket) return;
  connecting = true;
  await connect();
}

async function connect() {
  const dir = sessionDir();
  fs.mkdirSync(dir, { recursive: true });
  // Baileys utility, not a React hook — the "use" prefix is a naming clash.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { state, saveCreds } = await useMultiFileAuthState(dir);

  const sock = makeWASocket({ auth: state });
  socket = sock;
  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      console.log("[whatsapp] Scan QR ini dengan WhatsApp di HP admin untuk menyambungkan:");
      qrcodeTerminal.generate(qr, { small: true });
    }
    if (connection === "open") {
      console.log("[whatsapp] Tersambung.");
    }
    if (connection === "close") {
      socket = undefined;
      const statusCode = (lastDisconnect?.error as { output?: { statusCode?: number } } | undefined)?.output?.statusCode;
      const loggedOut = statusCode === 401;
      console.log(`[whatsapp] Koneksi terputus (status ${statusCode ?? "?"}).${loggedOut ? " Sesi keluar — hapus data/whatsapp-session lalu scan ulang." : " Mencoba menyambung ulang…"}`);
      if (!loggedOut) void connect();
    }
  });
}

export async function sendWhatsAppMessage(phoneNumber: string | null | undefined, message: string) {
  if (process.env.WHATSAPP_ENABLED !== "true") return;
  const normalized = normalizePhoneNumber(phoneNumber ?? undefined);
  if (!normalized) return;
  if (!socket) {
    console.warn("[whatsapp] Belum tersambung, notifikasi dilewati.");
    return;
  }
  try {
    await socket.sendMessage(`${normalized}@s.whatsapp.net`, { text: message });
  } catch (error) {
    console.warn("[whatsapp] Gagal mengirim pesan:", error instanceof Error ? error.message : error);
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Broadcasts go out with a short gap between sends instead of all at once —
// bursts of outbound messages are one of the patterns WhatsApp's automated
// abuse detection flags on unofficial connections like this one.
export async function sendWhatsAppBroadcast(recipients: Array<{ phone_number: string; full_name: string }>, message: (fullName: string) => string) {
  if (process.env.WHATSAPP_ENABLED !== "true") return;
  for (const recipient of recipients) {
    await sendWhatsAppMessage(recipient.phone_number, message(recipient.full_name));
    await sleep(1500);
  }
}
