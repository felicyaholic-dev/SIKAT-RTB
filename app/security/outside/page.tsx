import { CheckCircle2, Clock3, XCircle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { requireRole } from "@/lib/auth";
import { getSecurityHistory } from "@/lib/db";
import { initials, pill } from "@/lib/ui";

function time(value: string) {
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export default async function SecurityOutsidePage() {
  const session = await requireRole("SECURITY");
  const history = getSecurityHistory(session.accountId);
  const approvedExit = history.filter((item) => item.event_type === "EXIT").length;
  const approvedEntry = history.filter((item) => item.event_type === "ENTRY").length;
  const rejected = history.filter((item) => item.event_type === "EXIT_REJECTED").length;

  return (
    <AppShell role="SECURITY" name={session.name}>
      <div className="security-page mx-auto max-w-[1280px] px-5 py-9 md:px-10 md:py-11">
        <header className="mb-7 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="security-kicker">SATPAM</p>
            <h1 className="mt-2 text-[clamp(2rem,4vw,3.15rem)] font-medium tracking-[-0.06em] text-ink">Riwayat</h1>
            <p className="mt-2 text-sm text-muted">Hanya menampilkan keputusan izin yang kamu validasi sendiri.</p>
          </div>
          <span className="rounded-pill bg-mist px-3 py-2 font-mono text-[10px] tracking-wide text-muted">{history.length} validasi</span>
        </header>

        <section className="mb-5 grid gap-4 md:grid-cols-3">
          <article className="security-stat-card"><span className="grid h-11 w-11 place-items-center rounded-xl bg-safe-soft text-safe"><CheckCircle2 size={19} /></span><span><small>Izin keluar disetujui</small><b>{approvedExit}</b><em>Oleh Anda</em></span></article>
          <article className="security-stat-card"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#e4f5ff] text-signal"><Clock3 size={19} /></span><span><small>Masuk disetujui</small><b>{approvedEntry}</b><em>Oleh Anda</em></span></article>
          <article className="security-stat-card"><span className="grid h-11 w-11 place-items-center rounded-xl bg-danger-soft text-danger"><XCircle size={19} /></span><span><small>Izin dibatalkan</small><b>{rejected}</b><em>Oleh Anda</em></span></article>
        </section>
        <article className="security-card overflow-hidden p-5 sm:p-6">
          <p className="security-kicker">AKTIVITAS ANDA</p><h2 className="mt-2 text-lg font-medium tracking-tight text-ink">Riwayat keputusan izin</h2>
          {history.length ? (
            <div className="mt-5">
              {history.map((item) => {
                const outcome = item.event_type === "EXIT" ? "IZIN KELUAR DISETUJUI" : item.event_type === "ENTRY" ? "MASUK DISETUJUI" : "IZIN DIBATALKAN";
                const tone = item.event_type === "EXIT_REJECTED" ? "danger" : item.event_type === "ENTRY" ? "safe" : "amber";
                return <div key={item.event_id} className="flex flex-wrap items-center gap-3 border-t border-line py-3.5 first:border-t-0 transition-colors duration-150 hover:bg-signal-soft/40">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-signal-soft text-[10px] font-bold text-signal">{initials(item.full_name)}</span>
                  <span className="min-w-0 flex-1">
                    <b className="block truncate text-[13px]">{item.full_name}</b>
                    <small className="text-[11px] text-muted">
                      {item.class_name} · Kamar {item.room_number} · {item.destination}
                    </small>
                  </span>
                  <span className="text-right">
                    <small className="block text-[10px] text-muted">Divalidasi</small>
                    <b className="font-mono text-xs">{time(item.occurred_at)}</b>
                  </span>
                  <span className={pill(tone)}>{outcome}</span>
                </div>;
              })}
            </div>
          ) : (
            <p className="py-14 text-center text-sm text-muted">Belum ada keputusan izin yang kamu validasi.</p>
          )}
        </article>
      </div>
    </AppShell>
  );
}
