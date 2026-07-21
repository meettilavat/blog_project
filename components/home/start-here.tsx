import Link from "next/link";
import { resolveStartHere } from "@/lib/posts/start-here";
import type { PostListItem } from "@/lib/posts/contracts/domain/types";

export default function StartHere({ posts }: { posts: PostListItem[] }) {
  const picks = resolveStartHere(posts);
  if (picks.length === 0) return null;

  return (
    <section aria-labelledby="start-here-heading" className="space-y-5">
      <h2 id="start-here-heading" className="kicker">Start here</h2>
      <ol className="grid gap-0">
        {picks.map((pick) => (
          <li key={pick.slug} className="border-b border-border/60">
            <Link
              href={`/posts/${pick.slug}`}
              className="group grid gap-1 py-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
            >
              <span className="font-display text-[clamp(1.25rem,2vw,1.6rem)] font-semibold leading-snug text-foreground transition-colors group-hover:text-accent">
                {pick.title}
              </span>
              <span className="text-sm leading-relaxed text-foreground/70">{pick.why}</span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
