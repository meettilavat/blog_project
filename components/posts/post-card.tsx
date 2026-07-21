import Link from "next/link";
import PostCoverMedia from "@/components/posts/post-cover-media";
import PostMetaRow from "@/components/posts/post-meta-row";
import { type PostListItem } from "@/lib/posts/contracts/domain/types";

type PostCardProps = {
  post: PostListItem;
  href: string;
  variant: "admin";
  priority?: boolean;
};

const CLASSES = {
  admin: {
    card:
      "group flex h-full flex-col overflow-hidden rounded-3xl border border-border/70 bg-card/80 shadow-sm transition hover:-translate-y-[2px] hover:shadow-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground",
    image: "h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]",
    content: "flex flex-1 flex-col justify-between gap-4 p-5",
    body: "space-y-3",
    meta: "flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-foreground/60",
    title: "text-xl font-semibold tracking-tight text-foreground group-hover:text-accent transition duration-200",
    excerpt: "line-clamp-3 text-sm leading-relaxed text-foreground/70",
  }
} as const;

export function PostCard({
  post,
  href,
  priority = false
}: PostCardProps) {
  const classes = CLASSES.admin;

  return (
    <Link key={post.id} href={href} className={classes.card}>
      <div className="relative aspect-[4/3] overflow-hidden rounded-t-3xl bg-muted">
        <PostCoverMedia
          src={post.coverImageUrl}
          alt={post.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          className={classes.image}
          priority={priority}
          fetchPriority={priority ? "high" : undefined}
          emptyLabel="Cover pending"
        />
      </div>
      <div className={classes.content}>
        <div className={classes.body}>
          <PostMetaRow
            createdAt={post.createdAt}
            updatedAt={post.updatedAt}
            className={classes.meta}
          />
          <h2 className={classes.title}>{post.title}</h2>
          <p className={classes.excerpt}>
            {post.excerpt?.trim()
              ? post.excerpt
              : "Drafted with breathability in mind. Tap to read."}
          </p>
        </div>

        {/* ── CTA footer ── */}
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-accent">
          <span className="leading-none">Read</span>
          <span className="h-px w-10 bg-accent transition-[width] duration-200 group-hover:w-14 motion-reduce:transition-none" />
          <span className="text-[10px] transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transform-none motion-reduce:transition-none">→</span>
        </div>
      </div>
    </Link>
  );
}
