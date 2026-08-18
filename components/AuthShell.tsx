import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft } from "lucide-react";
import { Brand } from "@/components/Brand";
import { ThemeToggle } from "@/components/ThemeToggle";

export function AuthShell({
  backHref = "/",
  backLabel = "Kembali",
  kicker,
  heading,
  lede,
  noteIcon: NoteIcon,
  note,
  formKicker,
  title,
  subtitle,
  children,
  footer,
}: {
  backHref?: string;
  backLabel?: string;
  kicker: string;
  heading: React.ReactNode;
  lede: string;
  noteIcon: LucideIcon;
  note: string;
  formKicker: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    // Mobile: stacks top-to-bottom in DOM order below, so the heading leads
    // straight into the form — the action, not the pitch, is what's in view
    // first. Desktop: grid placement restores the two-column split, with the
    // lede/note pinned to the bottom of the left column via the 1fr row.
    <main className="flex min-h-screen flex-col md:grid md:grid-cols-[minmax(360px,0.85fr)_minmax(480px,1.15fr)] md:[grid-template-rows:auto_1fr]">
      <section className="bg-hero-sky flex flex-col gap-6 p-8 text-ink md:col-start-1 md:row-start-1 md:p-14 md:pb-8">
        <div className="flex items-center justify-between gap-3">
          <Link href={backHref} className="inline-flex w-fit items-center gap-2 text-sm text-muted transition-colors hover:text-ink">
            <ArrowLeft size={16} strokeWidth={1.6} /> {backLabel}
          </Link>
          <ThemeToggle />
        </div>
        <Brand />
        <div className="max-w-md">
          <p className="font-mono text-[11px] tracking-[0.12em] text-signal">{kicker}</p>
          <h1 className="mt-4 text-[clamp(1.9rem,5vw,3.4rem)] leading-[0.98] font-semibold tracking-tight">{heading}</h1>
        </div>
      </section>

      <section className="grid place-items-center bg-paper p-8 md:col-start-2 md:row-start-1 md:row-span-2 md:p-10">
        <div className="w-full max-w-md py-6">
          <p className="font-mono text-[11px] tracking-[0.12em] text-signal">{formKicker}</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-ink">{title}</h2>
          <p className="mt-1.5 mb-8 text-sm text-muted">{subtitle}</p>
          {children}
          {footer}
        </div>
      </section>

      <section className="bg-hero-sky flex flex-col gap-6 p-8 pt-0 text-ink md:col-start-1 md:row-start-2 md:self-end md:p-14 md:pt-0">
        <p className="max-w-md text-[15px] leading-relaxed text-muted">{lede}</p>
        <div className="flex max-w-sm items-start gap-3 border border-line bg-white/60 p-4 text-[13px] leading-relaxed text-ink/80 dark:bg-surface/60">
          <NoteIcon size={18} strokeWidth={1.6} className="mt-0.5 shrink-0 text-signal" />
          <span>{note}</span>
        </div>
      </section>
    </main>
  );
}
