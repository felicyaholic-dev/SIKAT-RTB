import Link from "next/link";
import { BrandMark } from "@/components/Brand";
import { AppShell } from "@/components/AppShell";
import { requireRole } from "@/lib/auth";
import { getStudentData } from "@/lib/db";
import { btn } from "@/lib/ui";

export default async function StudentPage() {
  const session = await requireRole("STUDENT");
  const data = getStudentData(session.accountId);
  if (!data) return null;
  const { resident, activePermit } = data;
  const isOutside = activePermit?.status === "SEDANG_DI_LUAR" || activePermit?.status === "MENUNGGU_MASUK";

  return (
    <AppShell role="STUDENT" name={session.name}>
      <div className="mx-auto max-w-6xl px-5 py-9 md:px-10 md:py-10">
        <header className="mb-7 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] tracking-[0.1em] text-signal">RINGKASAN PRIBADI</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink md:text-4xl">Halo, {resident.full_name.split(" ")[0]}.</h1>
            <p className="mt-1 text-sm text-muted">Semua status keluar-masukmu dirangkum dalam satu catatan.</p>
          </div>
          <span className="border border-line px-3 py-2 font-mono text-[11px] tracking-wide text-muted">Kamar {resident.room_number}</span>
        </header>

        <section className="bg-hero-sky relative grid gap-6 p-7 text-ink md:grid-cols-[1.2fr_0.8fr] md:p-9">
          <div>
            <p className="flex items-center gap-2 font-mono text-[10px] text-muted">
              <i aria-hidden className={`h-1.5 w-1.5 rounded-full not-italic ${isOutside ? "bg-amber" : "bg-signal"}`} /> STATUS HUNIAN
            </p>
            <h2 className="mt-5 text-3xl leading-tight font-medium">
              {isOutside ? (
                <>
                  Kamu sedang
                  <br />
                  <b className="font-semibold text-amber">di luar RTB.</b>
                </>
              ) : (
                <>
                  Kamu tercatat
                  <br />
                  <b className="font-semibold text-signal">di dalam RTB.</b>
                </>
              )}
            </h2>
            <p className="mt-2 text-[13px] text-muted">{activePermit ? `Aktivitas ${activePermit.permit_code} · ${activePermit.destination}` : "Tidak ada aktivitas aktif saat ini."}</p>
            <Link href={activePermit?.status === "SEDANG_DI_LUAR" ? "/student/apply" : activePermit ? "/student/permit" : "/student/apply"} className={`${btn.base} ${btn.primary} mt-6`}>
              {activePermit?.status === "SEDANG_DI_LUAR" ? "Buat QR masuk" : activePermit ? "Lihat QR aktif" : "Buat aktivitas"}
            </Link>
          </div>
          <div className="hidden items-center justify-center md:flex">
            <BrandMark size={120} />
          </div>
        </section>
      </div>
    </AppShell>
  );
}
