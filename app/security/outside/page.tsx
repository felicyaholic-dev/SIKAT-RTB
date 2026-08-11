import { AppShell } from "@/components/AppShell";
import { requireRole } from "@/lib/auth";
import { getSecurityQueue } from "@/lib/db";
import { initials, pill } from "@/lib/ui";

function time(value: string) {
  return new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export default async function SecurityOutsidePage() {
  const session = await requireRole("SECURITY");
  const queue = getSecurityQueue();

  return (
    <AppShell role="SECURITY" name={session.name}>
      <div className="mx-auto max-w-6xl px-5 py-9 md:px-10 md:py-10">
        <header className="mb-7 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] tracking-[0.1em] text-signal">PEMANTAUAN LANGSUNG</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink md:text-4xl">Mahasiswa di luar RTB.</h1>
            <p className="mt-1 text-sm text-muted">Daftar penghuni yang masih berada di luar, urut berdasarkan rencana kembali.</p>
          </div>
          <span className="rounded-pill bg-mist px-3 py-2 font-mono text-[10px] tracking-wide text-muted">{queue.length} aktif</span>
        </header>

        <article className="border border-line bg-surface p-6">
          {queue.length ? (
            <div>
              {queue.map((item) => (
                <div key={item.id} className="flex flex-wrap items-center gap-3 border-t border-line py-3.5 first:border-t-0 transition-colors duration-150 hover:bg-signal-soft/40">
                  <span className="grid h-9 w-9 shrink-0 place-items-center bg-signal-soft text-[10px] font-bold text-navy">{initials(item.full_name)}</span>
                  <span className="min-w-0 flex-1">
                    <b className="block truncate text-[13px]">{item.full_name}</b>
                    <small className="text-[11px] text-muted">
                      Kamar {item.room_number} · {item.destination}
                    </small>
                  </span>
                  <span className="text-right">
                    <small className="block text-[10px] text-muted">Rencana kembali</small>
                    <b className="font-mono text-xs">{time(item.planned_return_at)}</b>
                  </span>
                  <span className={pill(item.status === "TERLAMBAT" ? "danger" : "safe")}>{item.status === "TERLAMBAT" ? "TERLAMBAT" : "DI LUAR"}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-muted">Tidak ada mahasiswa yang sedang berada di luar RTB.</p>
          )}
        </article>
      </div>
    </AppShell>
  );
}
