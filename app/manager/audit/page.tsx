import { ClipboardList, History } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { requireRole } from "@/lib/auth";
import { getAuditLog } from "@/lib/db";
import { formatJakartaTimestamp } from "@/lib/ui";

const actionLabel: Record<string, string> = {
  CREATE_STUDENT_ACCOUNT: "Tambah akun penghuni",
  IMPORT_RESIDENTS: "Impor penghuni (Excel)",
  CREATE_SECURITY_STAFF: "Tambah akun satpam",
  UPDATE_SECURITY_STAFF: "Ubah data satpam",
  DELETE_SECURITY_STAFF: "Hapus akun satpam",
  UPDATE_RESIDENT: "Ubah data penghuni",
  UPDATE_OWN_CONTACT: "Penghuni ubah kontak sendiri",
  DELETE_RESIDENT: "Hapus data penghuni",
  DELETE_RESIDENTS_BY_CLASS: "Hapus penghuni sekelas",
  RESET_PASSWORD: "Reset password mandiri",
  CHANGE_PASSWORD: "Ganti password",
  UPDATE_MANAGER_PROFILE: "Ubah profil pengelola",
  CREATE_BROADCAST_NOTIFICATION: "Kirim broadcast",
  DELETE_BROADCAST_NOTIFICATION: "Hapus broadcast",
  RESET_HISTORY_CLASS: "Reset riwayat (per kelas)",
  RESET_HISTORY_ALL: "Reset riwayat (seluruh sistem)",
};

const entityLabel: Record<string, string> = {
  account: "akun",
  master_resident: "penghuni",
  security_staff: "satpam",
  class: "kelas",
  broadcast_notification: "broadcast",
  system: "sistem",
};

const roleLabel: Record<string, string> = { STUDENT: "Penghuni", SECURITY: "Satpam", MANAGER: "Pengelola" };

function time(value: string) {
  return formatJakartaTimestamp(value, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default async function ManagerAuditPage() {
  const session = await requireRole("MANAGER");
  const log = getAuditLog();

  return (
    <AppShell role="MANAGER" name={session.name}>
      <div className="security-page mx-auto max-w-[1280px] px-5 py-9 md:px-10 md:py-11">
        <header className="mb-7 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="security-kicker">PENGELOLA</p>
            <h1 className="mt-2 text-[clamp(2rem,4vw,3.15rem)] font-medium tracking-[-0.06em] text-ink">Log Aktivitas</h1>
            <p className="mt-2 text-sm text-muted">Jejak audit setiap aksi sensitif: tambah/hapus penghuni & satpam, ganti password, broadcast, dan reset riwayat.</p>
          </div>
          <span className="rounded-pill bg-mist px-3 py-2 font-mono text-[10px] tracking-wide text-muted">{log.length} entri</span>
        </header>

        <article className="security-card overflow-hidden p-5 sm:p-6">
          <p className="security-kicker">AUDIT SISTEM</p>
          <h2 className="mt-2 text-lg font-medium tracking-tight text-ink">300 aksi terbaru</h2>
          {log.length ? (
            <div className="mt-5">
              {log.map((item) => (
                <div key={item.id} className="grid grid-cols-[40px_minmax(0,1fr)] gap-x-3 gap-y-2 border-t border-line py-4 first:border-t-0 transition-colors duration-150 hover:bg-signal-soft/40 md:grid-cols-[40px_minmax(0,1fr)_auto] md:items-center md:gap-y-0">
                  <span className="row-span-2 grid h-10 w-10 place-items-center self-center rounded-xl bg-signal-soft text-signal"><ClipboardList size={18} /></span>
                  <span className="min-w-0">
                    <b className="block truncate text-[13px]">{actionLabel[item.action] ?? item.action}</b>
                    <small className="mt-0.5 block truncate text-[11px] text-muted">
                      {entityLabel[item.entity_type] ?? item.entity_type} · {item.entity_id}
                    </small>
                  </span>
                  <div className="col-start-2 flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-line pt-3 md:col-start-auto md:row-span-2 md:border-0 md:pt-0">
                    <span className="min-w-0">
                      <small className="block text-[10px] text-muted">Oleh</small>
                      <b className="block truncate text-xs text-ink">{item.actor_name ?? "Akun dihapus"}{item.actor_role ? ` · ${roleLabel[item.actor_role]}` : ""}</b>
                      <small className="mt-0.5 block whitespace-nowrap font-mono text-[10px] text-muted">{time(item.created_at)}</small>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5 flex min-h-[160px] items-center justify-center gap-3 text-sm text-muted">
              <History size={22} className="text-signal" />
              <p>Belum ada aksi tercatat.</p>
            </div>
          )}
        </article>
      </div>
    </AppShell>
  );
}
