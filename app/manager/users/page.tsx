import { DatabaseBackup } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AddResidentForm } from "@/app/manager/AddResidentForm";
import { DeleteResidentButton, EditResidentForm } from "@/app/manager/EditResidentForm";
import { DeleteResidentsByClass } from "@/app/manager/DeleteResidentsByClass";
import { ImportResidentsForm } from "@/app/manager/ImportResidentsForm";
import { ResetHistoryControl } from "@/app/manager/ResetHistoryControl";
import { SecurityStaffControl } from "@/app/manager/SecurityStaffControl";
import { NotificationBroadcast } from "@/app/manager/NotificationBroadcast";
import { requireRole } from "@/lib/auth";
import { getBroadcastHistory, getManagerData } from "@/lib/db";
import { btn, initials, pill } from "@/lib/ui";

export default async function ManagerUsersPage() {
  const session = await requireRole("MANAGER");
  const { residents, securityStaff } = getManagerData();
  const broadcasts = getBroadcastHistory();

  return (
    <AppShell role="MANAGER" name={session.name}>
      <div className="security-page mx-auto max-w-[1280px] px-5 py-9 md:px-10 md:py-11">
        <header className="mb-7 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="security-kicker">PENGELOLA</p>
            <h1 className="mt-2 text-[clamp(2rem,4vw,3.15rem)] font-medium tracking-[-0.06em] text-ink">Pengaturan</h1>
            <p className="mt-2 text-sm text-muted">Kelola akses pengguna dan data penghuni RTB.</p>
          </div>
        </header>

        <section className="security-card p-5 sm:p-6">
          <div className="mb-3.5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="security-kicker">DATA AKSES</p>
              <h2 className="mt-2 text-lg font-medium tracking-tight">Pengguna yang dapat masuk</h2>
              <p className="mt-1 text-sm text-muted">ID BCA mahasiswa terdiri dari 6 angka dan dipakai sistem untuk membuat akun.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <ImportResidentsForm />
              <DeleteResidentsByClass />
              <AddResidentForm />
            </div>
          </div>
          <div className="overflow-auto rounded-xl border border-line bg-white dark:bg-surface">
            <table className="w-full min-w-[790px] border-collapse">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left font-mono text-[10px] font-medium tracking-wide text-muted">Penghuni</th>
                  <th className="px-4 py-3 text-left font-mono text-[10px] font-medium tracking-wide text-muted">ID BCA</th>
                  <th className="px-4 py-3 text-left font-mono text-[10px] font-medium tracking-wide text-muted">Kamar</th>
                  <th className="px-4 py-3 text-left font-mono text-[10px] font-medium tracking-wide text-muted">Kelas</th>
                  <th className="px-4 py-3 text-left font-mono text-[10px] font-medium tracking-wide text-muted">Jenis kelamin</th>
                  <th className="px-4 py-3 text-left font-mono text-[10px] font-medium tracking-wide text-muted">Akun</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {residents.map((resident) => (
                  <tr key={resident.id} className="border-t border-line transition-colors duration-150 hover:bg-signal-soft/40">
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2.5">
                        <i className="grid h-7 w-7 place-items-center bg-signal-soft text-[9px] font-bold text-navy not-italic">{initials(resident.full_name)}</i>
                        <span>
                          <b className="block text-xs">{resident.full_name}</b>
                          <small className="text-[10px] text-muted">{resident.resident_status === "ACTIVE" ? "Penghuni aktif" : "Nonaktif"}</small>
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <code className="font-mono text-[10px] text-muted">{resident.bca_id}</code>
                    </td>
                    <td className="px-4 py-3 text-xs">{resident.room_number}</td>
                    <td className="px-4 py-3 text-xs">{resident.class_name}</td>
                    <td className="px-4 py-3 text-xs text-muted">{resident.gender === "PEREMPUAN" ? "Perempuan" : resident.gender === "LAKI_LAKI" ? "Laki-laki" : "—"}</td>
                    <td className="px-4 py-3">
                      <span className={pill(resident.account_status === "Aktif" ? "safe" : "muted")}>{resident.account_status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2">
                        <EditResidentForm resident={resident} />
                        <DeleteResidentButton resident={resident} />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <SecurityStaffControl staff={securityStaff} />
        <section className="security-card mt-5 p-5 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="security-kicker">DATABASE</p>
              <h2 className="mt-2 text-lg font-medium tracking-tight">Backup database</h2>
              <p className="mt-1 text-sm text-muted">
                Sistem otomatis menyimpan cadangan harian di server (disimpan 14 hari terakhir) — melindungi dari korupsi data,
                bukan dari hilangnya volume Railway itu sendiri. Unduh salinan ini secara berkala dan simpan di tempat lain
                (Google Drive, laptop, dll.) untuk perlindungan penuh.
              </p>
            </div>
            <a href="/api/backup" className={`${btn.base} ${btn.outline} shrink-0`}>
              <DatabaseBackup size={16} /> Unduh backup
            </a>
          </div>
        </section>
        <ResetHistoryControl />
        <NotificationBroadcast broadcasts={broadcasts} />
      </div>
    </AppShell>
  );
}
