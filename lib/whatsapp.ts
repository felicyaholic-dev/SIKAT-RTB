import "server-only";

import { normalizePhoneNumber } from "@/lib/db";

const FONNTE_SEND_URL = "https://api.fonnte.com/send";

export async function sendWhatsAppMessage(phoneNumber: string | null | undefined, message: string) {
  const token = process.env.FONNTE_API_KEY;
  if (!token) return;
  const normalized = normalizePhoneNumber(phoneNumber ?? undefined);
  if (!normalized) return;
  try {
    const response = await fetch(FONNTE_SEND_URL, {
      method: "POST",
      headers: { Authorization: token, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ target: normalized, message }),
    });
    if (!response.ok) {
      console.warn("[whatsapp] Fonnte merespons error:", response.status, await response.text());
    }
  } catch (error) {
    console.warn("[whatsapp] Gagal mengirim pesan:", error instanceof Error ? error.message : error);
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Broadcasts go out with a short gap between sends instead of all at once —
// gentler on Fonnte's own rate limits and less likely to look like a spam
// burst to WhatsApp on their end.
export async function sendWhatsAppBroadcast(recipients: Array<{ phone_number: string; full_name: string }>, message: (fullName: string) => string) {
  if (!process.env.FONNTE_API_KEY) return;
  for (const recipient of recipients) {
    await sendWhatsAppMessage(recipient.phone_number, message(recipient.full_name));
    await sleep(1500);
  }
}
