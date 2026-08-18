import "server-only";

import nodemailer from "nodemailer";
import { normalizeEmail } from "@/lib/db";

let transporter: ReturnType<typeof nodemailer.createTransport> | null | undefined;

// Lazily built once per server process, same lazy/optional pattern as
// lib/whatsapp.ts — if SMTP isn't configured, every send below silently
// no-ops instead of throwing, so the feature stays off until set up.
function getTransporter() {
  if (transporter !== undefined) return transporter;
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    transporter = null;
    return transporter;
  }
  const port = Number(process.env.SMTP_PORT) || 587;
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465,
    auth: { user, pass },
  });
  return transporter;
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
  const client = getTransporter();
  if (!client) return;
  const address = normalizeEmail(to ?? undefined);
  if (!address) return;
  try {
    const info = await client.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to: address, subject, html });
    if (process.env.EMAIL_DEBUG === "true") console.log("[email] sent:", nodemailer.getTestMessageUrl(info) || info.messageId);
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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Same gentle pacing as the WhatsApp broadcast — a short gap between sends
// rather than firing everything at once against the SMTP server.
export async function sendEmailBroadcast(recipients: Array<{ email: string | null; full_name: string }>, title: string, body: string) {
  if (!getTransporter()) return;
  for (const recipient of recipients) {
    await send(recipient.email, `${title} — SIKAT RTB`, wrap(title, [`Yth. <b>${recipient.full_name}</b>,`, body.replace(/\n/g, "<br/>")]));
    await sleep(300);
  }
}
