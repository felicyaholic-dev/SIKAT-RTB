import { AppShell } from "@/components/AppShell";
import { requireRole } from "@/lib/auth";
import { getStudentData } from "@/lib/db";
import { formatJakartaInput, formatJakartaTimestamp, permitTone, pill } from "@/lib/ui";

function formatDate(value: string) {
  return formatJakartaInput(value, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default async function StudentHistoryPage() {
  const session = await requireRole("STUDENT");
  const data = getStudentData(session.accountId);
  if (!data) return null;
  const { history } = data;

  return (
    <AppShell role="STUDENT" name={session.name}>
      <div className="mx-auto max-w-6xl px-5 py-9 md:px-10 md:py-10">
        <header className="mb-7">
          <p className="font-mono text-[11px] tracking-[0.1em] text-signal">RIWAYAT PRIBADI</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink md:text-4xl">Aktivitas keluar-masuk.</h1>
          <p className="mt-1 text-sm text-muted">Lima aktivitas keluar-masuk terakhir yang kamu buat.</p>
        </header>

        <article className="border border-line bg-surface p-6">
          {history.length ? (
            <div>
              {history.map((permit) => (
                <div key={permit.id} className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-line py-3.5 first:border-t-0 transition-colors duration-150 hover:bg-signal-soft/40">
                  <time className="w-12 shrink-0 font-mono text-[11px] text-muted">
                    {formatJakartaTimestamp(permit.created_at, { day: "2-digit", month: "short" })}
                  </time>
                  <span className="min-w-0 flex-1">
                    <b className="block truncate text-[13px]">{permit.destination}</b>
                    <small className="text-[11px] text-muted">
                      {permit.permit_code} · Keluar {formatDate(permit.planned_departure_at)}
                    </small>
                  </span>
                  <span className={pill(permitTone(permit.status))}>{permit.status.replaceAll("_", " ")}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-muted">Belum ada riwayat izin.</p>
          )}
        </article>
      </div>
    </AppShell>
  );
}
