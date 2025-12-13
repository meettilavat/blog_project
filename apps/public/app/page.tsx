import Image from "next/image";
import { getPublishedPosts } from "@/lib/data/posts";
import { Badge } from "@/components/ui/badge";
import { formatDate, isSignificantlyUpdated, isAllowedImageHost } from "@/lib/utils";

export const revalidate = 3600;

export default async function HomePage() {
  const posts = await getPublishedPosts();

  return (
    <section className="grid auto-rows-fr gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {posts.length === 0 && (
        <div className="sm:col-span-2 lg:col-span-3 rounded-2xl border border-dashed border-border/70 p-10 text-foreground/60">
          No posts exist yet.
        </div>
      )}
      {posts.map((post) => (
        <a
          key={post.id}
          href={`/posts/${post.slug}`}
          className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border/70 bg-card/80 shadow-sm transition hover:-translate-y-[2px] hover:shadow-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
        >
          <div className="relative aspect-[4/3] overflow-hidden rounded-t-3xl bg-muted">
            {post.cover_image_url ? (
              isAllowedImageHost(post.cover_image_url) ? (
                <Image
                  src={post.cover_image_url}
                  alt={post.title}
                  width={1200}
                  height={900}
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={post.cover_image_url}
                  alt={post.title}
                  className="h-full w-full object-cover"
                  width={1200}
                  height={900}
                />
              )
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-[0.2em] text-foreground/50">
                Cover pending
              </div>
            )}
          </div>
          <div className="flex flex-1 flex-col justify-between gap-4 p-5">
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-foreground/60">
                <span>{formatDate(post.created_at)}</span>
                {isSignificantlyUpdated(post.created_at, post.updated_at) && (
                  <Badge variant="outline">Last updated {formatDate(post.updated_at)}</Badge>
                )}
              </div>
              <h2 className="text-xl font-semibold tracking-tight text-foreground group-hover:text-accent transition duration-200">
                {post.title}
              </h2>
              <p className="line-clamp-3 text-sm leading-relaxed text-foreground/70">
                {post.excerpt?.trim()
                  ? post.excerpt
                  : "Drafted with breathability in mind. Tap to read."}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-accent">
              <span className="leading-none">Read</span>
              <span className="h-px w-10 bg-accent transition-all group-hover:w-14" />
              <span className="text-[10px] transition-transform duration-200 group-hover:translate-x-0.5">
                →
              </span>
            </div>
          </div>
        </a>
      ))}
    </section>
  );
}
