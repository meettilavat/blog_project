import Link from "next/link";
import PostCoverMedia from "@/components/posts/post-cover-media";
import PostMetaRow from "@/components/posts/post-meta-row";
import { type PostListItem } from "@/lib/types";
import { cn } from "@/lib/utils";

type PostCardProps = {
  post: PostListItem;
  href: string;
  variant: "public" | "admin";
};

const CLASSES = {
  public: {
    card:
      "group flex h-full min-w-0 flex-col overflow-hidden rounded-[1.75rem] border border-border/60 bg-card/95 shadow-[0_8px_30px_-12px_rgba(36,30,24,0.25)] transition-[transform,box-shadow,border-color,background-color] duration-300 ease-out hover:-translate-y-1.5 hover:border-accent/30 hover:bg-card hover:shadow-[0_20px_50px_-16px_rgba(36,30,24,0.35)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground motion-reduce:transform-none motion-reduce:transition-none",
    image:
      "h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04] motion-reduce:transform-none motion-reduce:transition-none",
    content: "flex min-w-0 flex-1 flex-col justify-between gap-4 p-5",
    body: "min-w-0 space-y-2.5",
    meta:
      "flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-foreground/55 [font-variant-numeric:tabular-nums]",
    title:
      "line-clamp-2 break-words font-serif text-[1.35rem] font-semibold leading-snug tracking-tight text-foreground transition-colors duration-200 group-hover:text-accent motion-reduce:transition-none",
    excerpt: "line-clamp-3 break-words text-[0.9rem] leading-relaxed text-foreground/65 text-pretty",
  },
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

export function PostCard({ post, href, variant }: PostCardProps) {
  const classes = CLASSES[variant];
  const isPublic = variant === "public";

  return (
    <Link key={post.id} href={href} className={classes.card}>
      <div className="relative aspect-[4/3] overflow-hidden rounded-t-3xl bg-muted">
        <PostCoverMedia
          src={post.cover_image_url}
          alt={post.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          className={classes.image}
          emptyLabel="Cover pending"
        />
      </div>
      <div className={classes.content}>
        <div className={classes.body}>
          <PostMetaRow
            createdAt={post.created_at}
            updatedAt={post.updated_at}
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
        {isPublic ? (
          <div className="flex items-center justify-between border-t border-border/50 pt-3">
            <span className="text-[11px] uppercase tracking-[0.2em] text-foreground/45">
              Read article
            </span>
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-accent/10 text-accent transition-[background-color,transform] duration-200 group-hover:bg-accent/20 group-hover:translate-x-0.5 motion-reduce:transform-none motion-reduce:transition-none">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-accent">
            <span className="leading-none">Read</span>
            <span className="h-px w-10 bg-accent transition-[width] duration-200 group-hover:w-14 motion-reduce:transition-none" />
            <span className="text-[10px] transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transform-none motion-reduce:transition-none">→</span>
          </div>
        )}
      </div>
    </Link>
  );
}

export default PostCard;
