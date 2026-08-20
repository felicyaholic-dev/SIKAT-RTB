import "server-only";

import { Resend } from "resend";
import { normalizeEmail } from "@/lib/db";

// Sends over HTTPS (Resend's API), not raw SMTP — Railway (and most PaaS
// hosts) restrict outbound SMTP ports, which made the earlier nodemailer/SMTP
// setup fail with ENETUNREACH/timeout regardless of DNS settings. HTTPS is
// never blocked, since it's the same path the app itself is served over.
let client: Resend | null | undefined;

function getClient() {
  if (client !== undefined) return client;
  const apiKey = process.env.RESEND_API_KEY;
  client = apiKey ? new Resend(apiKey) : null;
  return client;
}

function wrap(title: string, lines: string[]) {
  const rows = lines.map((line) => `<p style="margin:0 0 12px;color:#082f4c;font-size:14px;line-height:1.6">${line}</p>`).join("");
  return `<!doctype html>
<html><body style="margin:0;padding:32px 16px;background:#eaf7ff;font-family:Arial,Helvetica,sans-serif">
  <table role="presentation" width="100%" style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #d5ecf8">
    <tr><td style="background:#078cff;padding:20px 28px"><span style="color:#fff;font-weight:bold;font-size:16px;letter-spacing:.02em">SIKAT RTB</span></td></tr>
    <tr><td style="padding:28px">
      <h1 style="margin:0 0 16px;color:#082f4c;font-size:19px">${title}</h1>
      ${rows}
      <p style="margin:20px 0 0;color:#5e7b91;font-size:12px">Email otomatis dari Sistem Izin Keluar-Masuk Terintegrasi RTB — mohon tidak membalas email ini.</p>
    </td></tr>
  </table>
</body></html>`;
}

async function send(to: string | null | undefined, subject: string, html: string) {
  const resend = getClient();
  if (!resend) return;
  const address = normalizeEmail(to ?? undefined);
  if (!address) return;
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM || "SIKAT RTB <onboarding@resend.dev>",
      to: address,
      subject,
      html,
    });
    if (error) console.warn("[email] Resend menolak pengiriman:", error.message);
    else if (process.env.EMAIL_DEBUG === "true") console.log("[email] sent:", data?.id);
  } catch (error) {
    console.warn("[email] Gagal mengirim email:", error instanceof Error ? error.message : error);
  }
}

export async function sendPermitExitApprovedEmail(email: string | null | undefined, fullName: string, permitCode: string, destination: string, departureAt: string) {
  await send(email, "Izin keluar disetujui — SIKAT RTB", wrap("Izin keluar disetujui", [
    `Yth. <b>${fullName}</b>,`,
    `Pengajuan izin keluar dengan kode <b>${permitCode}</b> ke <b>${destination}</b> telah disetujui satpam.`,
    `Waktu keluar: <b>${departureAt}</b>.`,
    `Tunjukkan QR/kode izin ini kepada satpam saat kembali ke RTB.`,
  ]));
}

export async function sendPermitExitRejectedEmail(email: string | null | undefined, fullName: string, permitCode: string, destination: string) {
  await send(email, "Izin keluar ditolak — SIKAT RTB", wrap("Izin keluar ditolak", [
    `Yth. <b>${fullName}</b>,`,
    `Pengajuan izin keluar dengan kode <b>${permitCode}</b> ke <b>${destination}</b> ditolak oleh satpam.`,
    `Silakan hubungi satpam atau pengelola RTB jika ada pertanyaan.`,
  ]));
}

export async function sendPermitEntryConfirmedEmail(email: string | null | undefined, fullName: string, entryCode: string, returnAt: string) {
  await send(email, "Konfirmasi masuk — SIKAT RTB", wrap("Konfirmasi masuk RTB", [
    `Yth. <b>${fullName}</b>,`,
    `Kembalinya kamu ke RTB dengan kode <b>${entryCode}</b> telah dikonfirmasi satpam.`,
    `Waktu masuk: <b>${returnAt}</b>.`,
  ]));
}

export async function sendManagerPasswordResetEmail(email: string | null | undefined, fullName: string, resetUrl: string) {
  await send(email, "Reset password Pengelola — SIKAT RTB", wrap("Reset password Pengelola", [
    `Yth. <b>${fullName}</b>,`,
    `Ada permintaan reset password untuk akun Pengelola SIKAT RTB Anda. Klik tautan di bawah untuk mengatur password baru — berlaku 30 menit dan hanya bisa dipakai sekali.`,
    `<a href="${resetUrl}" style="color:#078cff;font-weight:bold">${resetUrl}</a>`,
    `Bukan Anda yang meminta ini? Abaikan email ini — password Anda tidak akan berubah.`,
  ]));
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Same gentle pacing as the WhatsApp broadcast — a short gap between sends
// rather than firing everything at once against the API's rate limit.
export async function sendEmailBroadcast(recipients: Array<{ email: string | null; full_name: string }>, title: string, body: string) {
  if (!getClient()) return;
  for (const recipient of recipients) {
    await send(recipient.email, `${title} — SIKAT RTB`, wrap(title, [`Yth. <b>${recipient.full_name}</b>,`, body.replace(/\n/g, "<br/>")]));
    await sleep(300);
  }
}
