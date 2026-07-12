import Link from "next/link";
import { formatDate } from "@/lib/typography/date";
import { entryType, ENTRY_TYPE_LABEL } from "@/lib/posts/featured";
import type { PostListItem } from "@/lib/posts/contracts/domain/types";

export function EntryLedger({ entries }: { entries: PostListItem[] }) {
  const total = entries.length;
  return (
    <section aria-labelledby="ledger-heading" className="space-y-5">
      <div className="flex items-end justify-between gap-5 border-b border-border/75 pb-3">
        <div>
          <p className="journal-label">The ledger / index of entries</p>
          <h2 id="ledger-heading" className="mt-2 font-serif text-[clamp(1.8rem,3.5vw,2.8rem)] leading-none tracking-[-0.02em]">Index</h2>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-foreground/65 [font-variant-numeric:tabular-nums]">{total} {total === 1 ? "entry" : "entries"}</span>
      </div>
      <ol className="grid">
        {entries.map((post, i) => {
          const entryNo = String(total - i).padStart(2, "0");
          const type = ENTRY_TYPE_LABEL[entryType(post)];
          return (
            <li key={post.id}>
              <Link
                href={`/posts/${post.slug}`}
                className="group grid gap-x-6 gap-y-1 border-b border-border/60 py-4 font-mono text-[11px] uppercase tracking-[0.14em] text-foreground/70 [font-variant-numeric:tabular-nums] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground note:grid-cols-[8rem_minmax(0,1fr)_8rem_4rem] note:items-baseline"
              >
                <span className="order-2 note:order-none">{formatDate(post.createdAt)}</span>
                <span className="order-1 font-serif text-[1.15rem] normal-case tracking-normal text-foreground transition-colors group-hover:text-accent note:order-none">{post.title}</span>
                <span className="order-3 note:order-none">{type}</span>
                <span className="order-4 flex items-center gap-2 text-accent note:order-none note:justify-end">Entry {entryNo}<span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span></span>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export default EntryLedger;
