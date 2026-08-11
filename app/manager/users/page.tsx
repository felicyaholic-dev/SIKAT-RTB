import { AppShell } from "@/components/AppShell";
import { AddResidentForm } from "@/app/manager/AddResidentForm";
import { EditResidentForm } from "@/app/manager/EditResidentForm";
import { SecurityStaffControl } from "@/app/manager/SecurityStaffControl";
import { requireRole } from "@/lib/auth";
import { getManagerData } from "@/lib/db";
import { initials, pill } from "@/lib/ui";

export default async function ManagerUsersPage() {
  const session = await requireRole("MANAGER");
  const { residents, securityStaff } = getManagerData();

  return (
    <AppShell role="MANAGER" name={session.name}>
      <div className="mx-auto max-w-6xl px-5 py-9 md:px-10 md:py-10">
        <header className="mb-7 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] tracking-[0.1em] text-signal">DATA USER</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink md:text-4xl">Data pengguna RTB.</h1>
            <p className="mt-1 text-sm text-muted">Kelola master penghuni dan akses satpam dari satu tempat.</p>
          </div>
        </header>

        <section>
          <div className="mb-3.5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] tracking-[0.1em] text-signal">SUMBER KEBENARAN</p>
              <h2 className="mt-2 text-xl font-semibold">Master penghuni</h2>
              <p className="mt-1 text-sm text-muted">ID BCA mahasiswa terdiri dari 6 angka dan dipakai sistem untuk aktivasi akun.</p>
            </div>
            <AddResidentForm />
          </div>
          <div className="overflow-auto border border-line bg-surface">
            <table className="w-full min-w-[710px] border-collapse">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left font-mono text-[10px] font-medium tracking-wide text-muted">Penghuni</th>
                  <th className="px-4 py-3 text-left font-mono text-[10px] font-medium tracking-wide text-muted">ID BCA</th>
                  <th className="px-4 py-3 text-left font-mono text-[10px] font-medium tracking-wide text-muted">Kamar</th>
                  <th className="px-4 py-3 text-left font-mono text-[10px] font-medium tracking-wide text-muted">Kelas</th>
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
                    <td className="px-4 py-3">
                      <span className={pill(resident.account_status === "Aktif" ? "safe" : "muted")}>{resident.account_status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <EditResidentForm resident={resident} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <SecurityStaffControl staff={securityStaff} />
      </div>
    </AppShell>
  );
}
