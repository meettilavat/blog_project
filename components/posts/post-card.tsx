import Link from "next/link";
import PostCoverMedia from "@/components/posts/post-cover-media";
import PostMetaRow from "@/components/posts/post-meta-row";
import { type PostListItem } from "@/lib/posts/contracts/domain/types";

type PostCardProps = {
  post: PostListItem;
  href: string;
  variant: "public" | "admin";
  priority?: boolean;
  presentation?: "standard" | "featured" | "note";
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
  variant,
  priority = false,
  presentation = "standard"
}: PostCardProps) {
  if (variant === "public") {
    const resolvedPresentation = presentation === "standard" ? "note" : presentation;
    const isFeatured = resolvedPresentation === "featured";
    const mediaSizes = isFeatured
      ? "(max-width: 1279px) calc(100vw - 2.5rem), (max-width: 1599px) 58vw, 840px"
      : "(max-width: 767px) calc(100vw - 2.5rem), (max-width: 1599px) 42vw, 560px";

    return (
      <Link
        href={href}
        data-post-presentation={resolvedPresentation}
        className="group block min-w-0 border-b border-border/70 py-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
      >
        <article
          className={isFeatured
            ? "grid min-w-0 gap-6 spread:grid-cols-[minmax(0,3fr)_minmax(22rem,2fr)] spread:items-start spread:gap-[clamp(2rem,4vw,4.5rem)]"
            : "grid min-w-0 gap-5 note:grid-cols-[minmax(9rem,0.5fr)_minmax(0,1fr)] note:items-center"
          }
        >
          <div
            className="relative aspect-[16/10] w-full min-w-0 overflow-hidden rounded-[10px] border border-border/75 bg-muted spread:self-center"
            data-media-sizes={mediaSizes}
          >
            <PostCoverMedia
              src={post.coverImageUrl}
              alt={post.title}
              fill
              sizes={mediaSizes}
              className="object-center transition-transform duration-[420ms] ease-out group-hover:scale-[1.018] motion-reduce:transform-none motion-reduce:transition-none"
              priority={priority}
              fetchPriority={priority ? "high" : undefined}
              emptyLabel="Cover pending"
            />
          </div>

          <div className={isFeatured ? "flex min-w-0 flex-col justify-between gap-8 py-1 spread:py-3" : "min-w-0 space-y-4"}>
            <div className="min-w-0 space-y-3">
              <PostMetaRow
                createdAt={post.createdAt}
                updatedAt={post.updatedAt}
                className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10px] uppercase tracking-[0.16em] text-foreground/70 [font-variant-numeric:tabular-nums]"
              />
              <h2 className={isFeatured
                ? "max-w-[18ch] text-balance font-serif text-[clamp(2rem,4vw,3.4rem)] font-semibold leading-[1.02] tracking-[-0.025em] text-foreground transition-colors duration-200 group-hover:text-accent motion-reduce:transition-none"
                : "text-balance font-serif text-[clamp(1.45rem,2.4vw,2rem)] font-semibold leading-[1.08] tracking-[-0.018em] text-foreground transition-colors duration-200 group-hover:text-accent motion-reduce:transition-none"
              }>
                {post.title}
              </h2>
              <p className={isFeatured
                ? "max-w-[56ch] text-pretty text-base leading-[1.75] text-foreground/75"
                : "line-clamp-3 max-w-[58ch] text-pretty text-[0.95rem] leading-[1.7] text-foreground/72"
              }>
                {post.excerpt?.trim()
                  ? post.excerpt
                  : "A field note from the workbench, recorded close to the system."}
              </p>
            </div>

            <div className="flex items-center gap-3 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/75">
              <span>{isFeatured ? "Read case study" : "Read field note"}</span>
              <span className="h-px w-10 origin-left bg-accent transition-transform duration-200 group-hover:scale-x-125 motion-reduce:transform-none" aria-hidden="true" />
              <span className="transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transform-none" aria-hidden="true">→</span>
            </div>
          </div>
        </article>
      </Link>
    );
  }

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
