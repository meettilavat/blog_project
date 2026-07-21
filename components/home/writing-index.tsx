import Link from "next/link";
import { formatDate } from "@/lib/typography/date";
import type { PostListItem } from "@/lib/posts/contracts/domain/types";

export default function WritingIndex({ posts }: { posts: PostListItem[] }) {
  return (
    <section aria-labelledby="all-writing-heading" className="space-y-5">
      <div className="flex items-baseline justify-between gap-5">
        <h2 id="all-writing-heading" className="kicker">All writing</h2>
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-foreground/65 [font-variant-numeric:tabular-nums]">
          {posts.length} {posts.length === 1 ? "post" : "posts"}
        </span>
      </div>
      <ol className="grid">
        {posts.map((post) => (
          <li key={post.id}>
            <Link
              href={`/posts/${post.slug}`}
              className="group grid gap-x-6 gap-y-1 border-b border-border/60 py-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground note:grid-cols-[8rem_minmax(0,1fr)_auto] note:items-baseline"
            >
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-foreground/70 [font-variant-numeric:tabular-nums] group-[:visited]:text-[var(--ink-muted)]">
                {formatDate(post.createdAt)}
              </span>
              <span className="min-w-0">
                <span className="block font-display text-[1.15rem] font-medium leading-snug text-foreground transition-colors group-hover:text-accent">
                  {post.title}
                </span>
                {post.excerpt ? (
                  <span className="mt-1 block text-sm leading-relaxed text-foreground/70 group-[:visited]:text-[var(--ink-muted)]">{post.excerpt}</span>
                ) : null}
              </span>
              <span className="flex items-center text-accent" aria-hidden="true">
                <span className="opacity-0 transition-opacity group-hover:opacity-100">→</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
