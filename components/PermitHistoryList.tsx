import { formatJakartaTimestamp, initials, pill } from "@/lib/ui";

type HistoryItem = {
  event_id: number;
  event_type: "EXIT" | "ENTRY" | "EXIT_REJECTED";
  occurred_at: string;
  destination: string;
  full_name: string;
  room_number: string;
  class_name: string;
  performed_by_name: string | null;
};

function time(value: string) {
  return formatJakartaTimestamp(value, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function PermitHistoryList({ history, emptyMessage }: { history: HistoryItem[]; emptyMessage: string }) {
  if (!history.length) return <p className="py-14 text-center text-sm text-muted">{emptyMessage}</p>;
  return (
    <div className="mt-5">
      {history.map((item) => {
        const outcome = item.event_type === "EXIT" ? "IZIN KELUAR DISETUJUI" : item.event_type === "ENTRY" ? "MASUK DISETUJUI" : "IZIN DIBATALKAN";
        const tone = item.event_type === "EXIT_REJECTED" ? "danger" : item.event_type === "ENTRY" ? "safe" : "amber";
        return <div key={item.event_id} className="grid grid-cols-[40px_minmax(0,1fr)] gap-x-3 gap-y-2 border-t border-line py-4 first:border-t-0 transition-colors duration-150 hover:bg-signal-soft/40 md:grid-cols-[40px_minmax(0,1fr)_auto] md:items-center md:gap-y-0">
          <span className="row-span-2 grid h-10 w-10 place-items-center self-center rounded-xl bg-signal-soft text-[10px] font-bold text-signal">{initials(item.full_name)}</span>
          <span className="min-w-0">
            <b className="block truncate text-[13px]">{item.full_name}</b>
            <small className="mt-0.5 block truncate text-[11px] text-muted">
              {item.class_name} · Kamar {item.room_number} · {item.destination}
            </small>
          </span>
          <div className="col-start-2 flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-line pt-3 md:col-start-auto md:row-span-2 md:border-0 md:pt-0">
            <span className="min-w-0">
              <small className="block text-[10px] text-muted">Divalidasi</small>
              <b className="block whitespace-nowrap font-mono text-xs text-ink">{time(item.occurred_at)}</b>
              <small className="mt-0.5 block truncate text-[10px] text-muted">oleh {item.performed_by_name ?? "satpam (akun dihapus)"}</small>
            </span>
            <span className={pill(tone)}>{outcome}</span>
          </div>
        </div>;
      })}
    </div>
  );
}
