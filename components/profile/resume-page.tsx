import { ArrowUpRight, Download } from "lucide-react";
import { LedgerNote, LedgerRow, LedgerSection } from "@/components/profile/resume-ledger";
import { AVAILABILITY_STATUS } from "@/lib/profile/availability";
import {
  RESUME_NAME,
  RESUME_ROLE,
  RESUME_STANDFIRST,
  actionLinks,
  contactRows,
  earlierWork,
  education,
  experience,
  selectedWork,
  skillGroups
} from "@/lib/profile/resume-data";

export default function ResumePage() {
  return (
    <article className="resume-sheet resume-ledger">
      <ResumeMasthead />
      <ResumeStandfirstBand />
      <ResumeContact />

      <LedgerSection title="Experience">
        {experience.map((entry) => (
          <LedgerRow key={entry.title} entry={entry} />
        ))}
      </LedgerSection>

      <LedgerSection title="Education">
        {education.map((entry) => (
          <LedgerRow key={entry.title} entry={entry} />
        ))}
      </LedgerSection>

      <LedgerSection title="Selected work">
        {selectedWork.map((entry) => (
          <LedgerRow key={entry.title} entry={entry} />
        ))}
        <LedgerNote label="Earlier" items={earlierWork} />
      </LedgerSection>

      <LedgerSection title="Skills">
        <ResumeSkills />
      </LedgerSection>
    </article>
  );
}

function ResumeMasthead() {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3 border-b border-border pb-4">
      <h1 className="m-0 font-display text-[clamp(1.9rem,3.4vw,2.6rem)] font-bold leading-[0.98] tracking-[-0.03em] text-foreground">
        {RESUME_NAME}
      </h1>
      <div className="text-left sm:text-right">
        <p className="kicker">{RESUME_ROLE}</p>
        <p className="kicker mt-1 text-accent">{AVAILABILITY_STATUS}</p>
      </div>
    </header>
  );
}

/**
 * The band that stops the compact masthead reading as empty: prose on the left,
 * the action links filling the horizontal void on the right.
 *
 * Splits at `ledger:` (832px), not a breakpoint of its own: that is the exact
 * complement of the `max-width: 831px` query that collapses `.resume-row`, so
 * this band and the ledger rows below it change shape at the same width. A
 * narrower breakpoint here would leave a band of widths where a two-column
 * standfirst sits above already-stacked rows.
 */
function ResumeStandfirstBand() {
  return (
    <div className="grid gap-x-10 gap-y-6 border-b border-border py-5 ledger:grid-cols-[minmax(0,1fr)_auto]">
      <p className="m-0 max-w-[50ch] text-[clamp(0.95rem,1.2vw,1.05rem)] leading-[1.7] text-foreground/80">
        {RESUME_STANDFIRST}
      </p>
      <div className="flex flex-wrap gap-x-6 gap-y-2 ledger:flex-col ledger:items-end ledger:gap-2">
        {actionLinks.map((link) => (
          <a
            key={link.label}
            href={link.href}
            download={link.download}
            target={link.external ? "_blank" : undefined}
            rel={link.external ? "noreferrer" : undefined}
            className="inline-flex min-h-11 items-center gap-1.5 border-b border-accent/65 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground print:hidden"
          >
            {link.download ? <Download className="h-3.5 w-3.5" aria-hidden="true" /> : null}
            {link.label}
            {link.external ? <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" /> : null}
          </a>
        ))}
      </div>
    </div>
  );
}

/**
 * A skill group is the same construct as a contact row — a label in the mono
 * track, its value in the content track — so it takes the same dl/dt/dd markup
 * rather than div/p/ul. The <ul> survives inside the <dd> because the items are
 * genuine peers: the "/" between them is a CSS ::after, so flattening the list
 * would hand a screen reader one run-on string instead of a counted list.
 */
function ResumeSkills() {
  return (
    <dl className="m-0">
      {skillGroups.map((group) => (
        <div key={group.label} className="resume-row border-b border-border/60 py-3.5" data-resume-row="true">
          <dt className="kicker pt-1">{group.label}</dt>
          <dd className="m-0">
            <ul className="m-0 flex list-none flex-wrap p-0 text-sm leading-7 text-foreground/85">
              {group.items.map((item) => (
                <li key={item} className="after:mx-2 after:text-accent/70 after:content-['/'] last:after:hidden">
                  {item}
                </li>
              ))}
            </ul>
          </dd>
        </div>
      ))}
    </dl>
  );
}

function ResumeContact() {
  return (
    <dl className="m-0">
      {contactRows.map((row) => (
        <div key={row.label} className="resume-row border-b border-border/60 py-2.5" data-resume-row="true">
          <dt className="kicker pt-0.5">{row.label}</dt>
          <dd className="m-0 text-sm text-foreground/85">
            {row.href ? (
              <a
                href={row.href}
                className="transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
              >
                {row.value}
              </a>
            ) : (
              row.value
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
