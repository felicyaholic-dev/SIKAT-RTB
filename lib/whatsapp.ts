import "server-only";

import { normalizePhoneNumber } from "@/lib/db";

const GRAPH_API_VERSION = "v21.0";

// Business-initiated messages (this app never replies inside a customer
// service window) must use a pre-approved template — free-form text isn't
// allowed outside that window, so every notification maps to one template.
// Body copy mirrors these templates; edit both together if the wording
// changes, since the approved template text on Meta's side must match.
const TEMPLATES = {
  exitApproved: "sikat_izin_keluar_disetujui",
  exitRejected: "sikat_izin_keluar_ditolak",
  entryConfirmed: "sikat_konfirmasi_masuk",
  newNotification: "sikat_notifikasi_baru",
} as const;

async function sendTemplate(phoneNumber: string | null | undefined, templateName: string, bodyParams: string[]) {
  const token = process.env.WHATSAPP_CLOUD_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) return;
  const normalized = normalizePhoneNumber(phoneNumber ?? undefined);
  if (!normalized) return;
  try {
    const response = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: normalized,
        type: "template",
        template: {
          name: templateName,
          language: { code: "id" },
          components: [{ type: "body", parameters: bodyParams.map((text) => ({ type: "text", text })) }],
        },
      }),
    });
    if (!response.ok) {
      console.warn("[whatsapp] WhatsApp Cloud API error:", response.status, await response.text());
    }
  } catch (error) {
    console.warn("[whatsapp] Gagal mengirim pesan:", error instanceof Error ? error.message : error);
  }
}

// Body: "Yth. {{1}}, ... Kode Izin: {{2}} Keterangan: {{3}} Waktu Keluar: {{4}} ..."
export async function sendPermitExitApproved(phoneNumber: string | null | undefined, fullName: string, permitCode: string, destination: string, departureAt: string) {
  await sendTemplate(phoneNumber, TEMPLATES.exitApproved, [fullName, permitCode, destination, departureAt]);
}

// Body: "Yth. {{1}}, ... Kode Izin: {{2}} Keterangan: {{3}} ..."
export async function sendPermitExitRejected(phoneNumber: string | null | undefined, fullName: string, permitCode: string, destination: string) {
  await sendTemplate(phoneNumber, TEMPLATES.exitRejected, [fullName, permitCode, destination]);
}

// Body: "Yth. {{1}}, ... Kode Konfirmasi: {{2}} Waktu Masuk: {{3}} ..."
export async function sendPermitEntryConfirmed(phoneNumber: string | null | undefined, fullName: string, entryCode: string, returnAt: string) {
  await sendTemplate(phoneNumber, TEMPLATES.entryConfirmed, [fullName, entryCode, returnAt]);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Broadcasts go out with a short gap between sends rather than all at once —
// gentler on the API's own rate limits when many residents have a number on file.
// Body: "Yth. {{1}}, ... pengumuman: {{2}} ..."
export async function sendWhatsAppBroadcast(recipients: Array<{ phone_number: string | null; full_name: string }>, title: string) {
  if (!process.env.WHATSAPP_CLOUD_API_TOKEN) return;
  for (const recipient of recipients) {
    await sendTemplate(recipient.phone_number, TEMPLATES.newNotification, [recipient.full_name, title]);
    await sleep(1000);
  }
}
