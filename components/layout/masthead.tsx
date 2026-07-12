import type { ReactNode } from "react";
import Link from "next/link";
import { AVAILABILITY_STATUS } from "@/lib/profile/availability";

type MastheadProps = {
  eyebrow: string;
  title: ReactNode;
  dek?: string;
  note?: string;
  volume?: string;
  resumeHref?: string;
};

export function Masthead({ eyebrow, title, dek, note, volume = "Vol 01", resumeHref }: MastheadProps) {
  return (
    <div className="grid gap-10 pt-2 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-end">
      <div className="max-w-[62rem] space-y-5">
        <p className="journal-label">{eyebrow}</p>
        <h1 className="max-w-[14ch] text-balance font-serif text-[clamp(2.75rem,7vw,6.8rem)] leading-[0.94] tracking-[-0.035em] text-foreground">
          {title}
        </h1>
        {dek ? <p className="max-w-[52ch] text-[clamp(1.05rem,1.5vw,1.3rem)] leading-relaxed text-foreground/75">{dek}</p> : null}
        {resumeHref ? (
          <Link
            href={resumeHref}
            className="group inline-flex min-h-11 items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/75 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
          >
            View resume
            <span className="h-px w-10 bg-accent transition-transform group-hover:scale-x-125" aria-hidden="true" />
            <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
        ) : null}
      </div>
      <aside className="space-y-3 border-l border-border/75 pl-5 text-sm leading-relaxed text-foreground/70 lg:mb-1" aria-label="Issue index">
        <dl className="space-y-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-foreground/60 [font-variant-numeric:tabular-nums]">
          <div className="flex justify-between gap-3"><dt className="sr-only">Volume</dt><dd>{volume}</dd><dd>Issue ongoing</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-accent">Status</dt><dd>{AVAILABILITY_STATUS}</dd></div>
          <div className="flex justify-between gap-3"><dt className="sr-only">Location</dt><dd>Gujarat</dd><dd>UTC+05:30</dd></div>
        </dl>
        {note ? <p className="max-w-[30ch] border-t border-border/60 pt-3">{note}</p> : null}
      </aside>
    </div>
  );
}

export default Masthead;
