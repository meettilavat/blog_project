import Link from "next/link";
import { getPublishedPosts } from "@/lib/data/posts";
import PostCard from "@/components/posts/post-card";

export const revalidate = 3600;

export default async function HomePage() {
  const posts = await getPublishedPosts();

  return (
    <section className="grid auto-rows-fr gap-7 sm:grid-cols-2 lg:grid-cols-3">
      {posts.length === 0 && (
        <div className="sm:col-span-2 lg:col-span-3 rounded-3xl border border-dashed border-border/80 bg-card/70 p-10 text-foreground/70">
          <p className="text-base">No posts yet. Fresh writing is on the way.</p>
          <p className="mt-3 text-sm text-foreground/60">
            Until then, visit the{" "}
            <span className="font-medium text-accent">
              <Link href="/resume" className="underline decoration-accent/40 underline-offset-4 hover:decoration-accent">
                resume
              </Link>
            </span>{" "}
            for background and projects.
          </p>
        </div>
      )}
      {posts.map((post) => (
        <PostCard key={post.id} post={post} href={`/posts/${post.slug}`} variant="public" />
      ))}
    </section>
  );
}
