import { CheckCircle2, Clock3, XCircle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PermitHistoryList } from "@/components/PermitHistoryList";
import { HistoryFilters } from "@/components/HistoryFilters";
import { getPermitHistory, type ReportPeriod, type Role } from "@/lib/db";
import { RESIDENT_CLASSES } from "@/lib/ui";
import { WINGS } from "@/lib/wings";

const periodLabels: Record<ReportPeriod, string> = {
  DAY: "hari ini",
  WEEK: "7 hari terakhir",
  MONTH: "bulan ini",
  YEAR: "tahun ini",
  ALL: "semua waktu",
};

const roleKicker: Record<Extract<Role, "MANAGER" | "SECURITY">, string> = {
  MANAGER: "PENGELOLA",
  SECURITY: "SATPAM",
};

function parseMulti(value: string | undefined, valid: readonly string[]): string[] {
  if (!value) return [];
  return value.split(",").map((v) => v.trim()).filter((v) => valid.includes(v));
}

// Shared by the Pengelola "Riwayat" page and the Satpam "Riwayat" page —
// same filters (wing/kelas multi-select + jangka waktu), same underlying
// data (getPermitHistory), only the AppShell role/kicker and the route
// filters navigate to (basePath) differ.
export async function PermitHistoryPage({ role, name, basePath, searchParams }: { role: Extract<Role, "MANAGER" | "SECURITY">; name: string; basePath: string; searchParams: { wing?: string; kelas?: string; period?: string } }) {
  const period = (["DAY", "WEEK", "MONTH", "YEAR", "ALL"] as const).includes(searchParams.period as ReportPeriod) ? (searchParams.period as ReportPeriod) : "ALL";
  const wingList = parseMulti(searchParams.wing, WINGS.map((w) => w.code));
  const kelasList = parseMulti(searchParams.kelas, RESIDENT_CLASSES);
  const history = getPermitHistory({ wing: wingList.length ? wingList : undefined, className: kelasList.length ? kelasList : undefined, period });
  const approvedExit = history.filter((item) => item.event_type === "EXIT").length;
  const approvedEntry = history.filter((item) => item.event_type === "ENTRY").length;
  const rejected = history.filter((item) => item.event_type === "EXIT_REJECTED").length;
  const filterSummary = [periodLabels[period], wingList.length ? `wing ${wingList.join(", ")}` : null, kelasList.length ? kelasList.join(", ") : null].filter(Boolean).join(" · ");

  return (
    <AppShell role={role} name={name}>
      <div className="security-page mx-auto max-w-[1280px] px-5 py-9 md:px-10 md:py-11">
        <header className="mb-7 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="security-kicker">{roleKicker[role]}</p>
            <h1 className="mt-2 text-[clamp(2rem,4vw,3.15rem)] font-medium tracking-[-0.06em] text-ink">Riwayat</h1>
            <p className="mt-2 text-sm text-muted">Seluruh aktivitas keluar-masuk RTB, tervalidasi oleh satpam manapun · {filterSummary}.</p>
          </div>
          <span className="rounded-pill bg-mist px-3 py-2 font-mono text-[10px] tracking-wide text-muted">{history.length} validasi</span>
        </header>

        <HistoryFilters basePath={basePath} wing={wingList.join(",")} kelas={kelasList.join(",")} period={period} />

        <section className="mb-5 grid gap-4 md:grid-cols-3">
          <article className="security-stat-card"><span className="grid h-11 w-11 place-items-center rounded-xl bg-safe-soft text-safe"><CheckCircle2 size={19} /></span><span><small>Izin keluar disetujui</small><b>{approvedExit}</b><em>Semua satpam</em></span></article>
          <article className="security-stat-card"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#e4f5ff] text-signal"><Clock3 size={19} /></span><span><small>Masuk disetujui</small><b>{approvedEntry}</b><em>Semua satpam</em></span></article>
          <article className="security-stat-card"><span className="grid h-11 w-11 place-items-center rounded-xl bg-danger-soft text-danger"><XCircle size={19} /></span><span><small>Izin dibatalkan</small><b>{rejected}</b><em>Semua satpam</em></span></article>
        </section>
        <article className="security-card overflow-hidden p-5 sm:p-6">
          <p className="security-kicker">AKTIVITAS RTB</p><h2 className="mt-2 text-lg font-medium tracking-tight text-ink">Riwayat keputusan izin</h2>
          <PermitHistoryList history={history} emptyMessage="Belum ada keputusan izin yang cocok dengan filter ini." />
        </article>
      </div>
    </AppShell>
  );
}
