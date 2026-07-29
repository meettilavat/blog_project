import { ArrowUpRight } from "lucide-react";
import type { LedgerEntry } from "@/lib/profile/resume-data";
import { cn } from "@/lib/ui/classnames";

/**
 * A section break. The heading sits in the content track so it shares the
 * body's left edge; the label track repeats the section name so a row is never
 * orphaned from its section on a long scroll.
 *
 * That repeat is purely visual, so it is hidden from assistive tech — the <h2>
 * stays the single announced heading rather than being read out twice.
 *
 * It also only earns its place at wide widths. Below `ledger` (832px) the
 * .resume-row tracks collapse to a stack, which would put the kicker directly
 * above its own heading — the same word twice, in sequence — and a stacked label
 * cannot anchor a row whose heading has scrolled away anyway. `ledger:` is the
 * exact complement of the `max-width: 831px` collapse in globals.css.
 */
export function LedgerSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-[clamp(2.75rem,4.5vw,4rem)]" data-resume-section="true">
      <div className="resume-row border-b border-border pb-3">
        <span aria-hidden="true" className="kicker hidden self-end ledger:block">
          {title}
        </span>
        <h2 className="m-0 font-display text-[clamp(1.35rem,2.4vw,1.75rem)] font-bold leading-none tracking-[-0.025em] text-foreground">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

export function LedgerBullets({ items }: { items: string[] }) {
  return (
    <ul className="m-0 mt-2.5 grid list-none gap-1.5 p-0">
      {items.map((item) => (
        <li key={item} className="grid grid-cols-[0.5rem_minmax(0,1fr)] items-start gap-3">
          <span aria-hidden="true" className="mt-[0.68rem] inline-block h-px w-2 bg-accent" />
          <span className="block text-sm leading-[1.75] text-foreground/85">{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function LedgerRow({ entry, muted = false }: { entry: LedgerEntry; muted?: boolean }) {
  return (
    <article className="resume-row border-b border-border/60 py-4" data-resume-row="true">
      <p className="kicker tabular-nums pt-0.5">
        {entry.label}
        {entry.labelDetail ? (
          <>
            <br />
            {entry.labelDetail}
          </>
        ) : null}
      </p>
      <div className="min-w-0">
        <h3
          className={cn(
            "m-0 font-display text-[0.975rem] leading-snug tracking-[-0.01em] text-foreground",
            muted ? "font-normal" : "font-medium"
          )}
        >
          {entry.title}
        </h3>
        {entry.meta ? <p className="mt-0.5 text-sm text-foreground/70">{entry.meta}</p> : null}
        {entry.stack ? (
          <p className="mt-1.5 font-mono text-[10px] uppercase leading-relaxed tracking-[0.12em] text-foreground/70">
            {entry.stack}
          </p>
        ) : null}
        {/* Length, not truthiness: [] is truthy, and would render an empty <ul>
            — the empty-element-instead-of-omission failure this row avoids
            everywhere else. */}
        {entry.bullets?.length ? <LedgerBullets items={entry.bullets} /> : null}
        {entry.link ? (
          <a
            href={entry.link.href}
            target={entry.link.external ? "_blank" : undefined}
            rel={entry.link.external ? "noreferrer" : undefined}
            className="mt-2.5 inline-flex min-h-11 items-center gap-1 border-b border-accent/65 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
          >
            {entry.link.text}
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        ) : null}
      </div>
    </article>
  );
}

/**
 * Superseded work: one row carrying several one-line descriptions. Deliberately
 * without the accent rules a full entry gets, so it reads as an appendix.
 */
export function LedgerNote({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="resume-row border-b border-border/60 py-4" data-resume-row="true">
      <p className="kicker pt-0.5">{label}</p>
      <ul className="m-0 grid list-none gap-1.5 p-0">
        {items.map((item) => (
          <li key={item} className="text-sm leading-[1.7] text-foreground/62">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
