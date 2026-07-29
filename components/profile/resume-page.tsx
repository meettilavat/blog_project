import { ArrowUpRight, Download } from "lucide-react";
import {
  LedgerNote,
  LedgerRow,
  LedgerRowShell,
  LedgerSection
} from "@/components/profile/resume-ledger";
import { AVAILABILITY_STATUS } from "@/lib/profile/availability";
import {
  type ContactRow,
  RESUME_NAME,
  RESUME_ROLE,
  RESUME_STANDFIRST,
  actionLinks,
  contactRows,
  earlierWork,
  education,
  experience,
  printContactRows,
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
        {/* `!text-accent`, not `text-accent`: .kicker declares its own
            `color: var(--ink-muted)` and lives in author CSS *after*
            `@tailwind utilities`, so at equal specificity the later rule wins and
            a plain utility here is inert — the line renders muted grey. The
            important modifier is what actually recolours it. */}
        <p className="kicker mt-1 !text-accent">{AVAILABILITY_STATUS}</p>
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
      {/* The wrapper is hidden too, not just its links: hiding only the anchors
          collapses this grid row to 0px while the band's row-gap survives,
          leaving ~24px of contentless whitespace above the hairline on paper. */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 ledger:flex-col ledger:items-end ledger:gap-2 print:hidden">
        {actionLinks.map((link) => (
          <a
            key={link.label}
            href={link.href}
            download={link.download}
            target={link.external ? "_blank" : undefined}
            rel={link.external ? "noreferrer" : undefined}
            // `print:hidden` on every link, unconditionally: the whole cluster is
            // screen-only. A printed resume should not advertise a download, and
            // on paper a profile link is worse than absent — the arrow implies a
            // click, and the label alone gives a reader no URL to type. What paper
            // needs from these three is the URL, and that comes from the contact
            // ledger below (`printContactRows`), which is the single block a
            // reader looks in.
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
        <LedgerRowShell key={group.label} className="py-3.5">
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
        </LedgerRowShell>
      ))}
    </dl>
  );
}

/**
 * One contact line. Shared by the three rows that render in both media and the
 * two that only render on paper, so all five are literally the same row and a
 * printed page cannot end up with a contact block in two grammars.
 */
function ContactLedgerRow({ row, printOnly = false }: { row: ContactRow; printOnly?: boolean }) {
  return (
    <LedgerRowShell className="py-2.5" printOnly={printOnly}>
      {/* `self-center`, not `pt-0.5`: the value cell below is a 44px box with
          its text centred, and a top-padded label in a stretched grid cell
          would sit ~12px above the value it names. Both cells centre, so the
          label and its value share a line at every width. */}
      <dt className="kicker self-center">{row.label}</dt>
      {/* The 44px floor lives on the cell *and* on the anchor, for two
          different reasons. On the cell it keeps all three contact rows the
          same height — Base carries plain text, so without it that row would
          be 24px shorter than the two beside it. On the anchor it is the tap
          target itself: `items-center` centres rather than stretches, so a
          bare text-sm anchor would be a 20px hit area, which is the wrong
          thing to aim a thumb at for a `tel:` link. 44px matches the floor
          every other link on this page keeps. */}
      <dd className="m-0 flex min-h-11 items-center text-sm text-foreground/85">
        {row.href ? (
          <a
            href={row.href}
            className="inline-flex min-h-11 items-center transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          >
            {row.value}
          </a>
        ) : (
          row.value
        )}
      </dd>
    </LedgerRowShell>
  );
}

function ResumeContact() {
  return (
    <dl className="m-0">
      {contactRows.map((row) => (
        <ContactLedgerRow key={row.label} row={row} />
      ))}
      {/* Paper only, and last: on screen the action links in the band above
          already reach both profiles, but on paper a label is a dead end — the
          href goes nowhere a reader can follow. These rows put the two URLs as
          readable text in the block where a reader looks for a way to make
          contact, so all five values sit together instead of two of them being
          stranded as bare words beside the standfirst.

          `printContactRows`, not extra `contactRows` entries: these carry no
          href, because nothing on paper is clickable, and folding them into the
          screen list would print the URLs twice over and show them on screen
          next to the links that already carry them. */}
      {printContactRows.map((row) => (
        <ContactLedgerRow key={row.label} row={row} printOnly />
      ))}
    </dl>
  );
}
