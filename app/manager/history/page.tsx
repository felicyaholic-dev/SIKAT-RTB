import { CheckCircle2, Clock3, XCircle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PermitHistoryList } from "@/components/PermitHistoryList";
import { requireRole } from "@/lib/auth";
import { getPermitHistory } from "@/lib/db";

export default async function ManagerHistoryPage() {
  const session = await requireRole("MANAGER");
  const history = getPermitHistory();
  const approvedExit = history.filter((item) => item.event_type === "EXIT").length;
  const approvedEntry = history.filter((item) => item.event_type === "ENTRY").length;
  const rejected = history.filter((item) => item.event_type === "EXIT_REJECTED").length;

  return (
    <AppShell role="MANAGER" name={session.name}>
      <div className="security-page mx-auto max-w-[1280px] px-5 py-9 md:px-10 md:py-11">
        <header className="mb-7 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="security-kicker">PENGELOLA</p>
            <h1 className="mt-2 text-[clamp(2rem,4vw,3.15rem)] font-medium tracking-[-0.06em] text-ink">Riwayat</h1>
            <p className="mt-2 text-sm text-muted">Seluruh aktivitas keluar-masuk RTB, tervalidasi oleh satpam manapun.</p>
          </div>
          <span className="rounded-pill bg-mist px-3 py-2 font-mono text-[10px] tracking-wide text-muted">{history.length} validasi</span>
        </header>

        <section className="mb-5 grid gap-4 md:grid-cols-3">
          <article className="security-stat-card"><span className="grid h-11 w-11 place-items-center rounded-xl bg-safe-soft text-safe"><CheckCircle2 size={19} /></span><span><small>Izin keluar disetujui</small><b>{approvedExit}</b><em>Semua satpam</em></span></article>
          <article className="security-stat-card"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#e4f5ff] text-signal"><Clock3 size={19} /></span><span><small>Masuk disetujui</small><b>{approvedEntry}</b><em>Semua satpam</em></span></article>
          <article className="security-stat-card"><span className="grid h-11 w-11 place-items-center rounded-xl bg-danger-soft text-danger"><XCircle size={19} /></span><span><small>Izin dibatalkan</small><b>{rejected}</b><em>Semua satpam</em></span></article>
        </section>
        <article className="security-card overflow-hidden p-5 sm:p-6">
          <p className="security-kicker">AKTIVITAS RTB</p><h2 className="mt-2 text-lg font-medium tracking-tight text-ink">Riwayat keputusan izin</h2>
          <PermitHistoryList history={history} emptyMessage="Belum ada keputusan izin yang tercatat." />
        </article>
      </div>
    </AppShell>
  );
}
