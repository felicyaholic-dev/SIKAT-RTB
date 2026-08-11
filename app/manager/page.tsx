import { DoorOpen } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { requireRole } from "@/lib/auth";
import { getManagerData } from "@/lib/db";
import { initials, pill } from "@/lib/ui";

function time(value: string) {
  return new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export default async function ManagerPage() {
  const session = await requireRole("MANAGER");
  const { watchlist } = getManagerData();

  return (
    <AppShell role="MANAGER" name={session.name}>
      <div className="mx-auto max-w-6xl px-5 py-9 md:px-10 md:py-10">
        <header className="mb-7 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] tracking-[0.1em] text-signal">PEMANTAUAN RTB</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink md:text-4xl">Kondisi hunian hari ini.</h1>
            <p className="mt-1 text-sm text-muted">Perhatikan penghuni yang masih berada di luar dan melewati waktu kembali.</p>
          </div>
          <span className="rounded-pill bg-mist px-3 py-2 font-mono text-[10px] tracking-wide text-muted">LAPORAN HARI INI</span>
        </header>

        <article className="border border-line bg-surface p-6">
          <div className="mb-2 flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] tracking-[0.1em] text-signal">PERLU PERHATIAN</p>
              <h2 className="mt-2 text-xl font-semibold">Penghuni di luar RTB</h2>
            </div>
            <span className="rounded-pill bg-mist px-2.5 py-1.5 font-mono text-[10px] text-muted">{watchlist.length} orang</span>
          </div>
          {watchlist.length ? (
            <div className="mt-3">
              {watchlist.map((item) => (
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
            <div className="mt-6 flex min-h-[120px] items-center gap-3 text-sm text-muted">
              <DoorOpen size={28} className="text-signal" />
              <p>Semua penghuni tercatat berada di dalam RTB.</p>
            </div>
          )}
        </article>
      </div>
    </AppShell>
  );
}
