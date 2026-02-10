import { getPublishedPosts } from "@/lib/data/posts";
import PostCard from "@/components/posts/post-card";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const posts = await getPublishedPosts();

  return (
    <section className="grid auto-rows-fr gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {posts.length === 0 && (
        <div className="sm:col-span-2 lg:col-span-3 rounded-2xl border border-dashed border-border/70 p-10 text-foreground/60">
          No posts exist yet. Authenticate, then craft your first entry.
        </div>
      )}
      {posts.map((post) => (
        <PostCard key={post.id} post={post} href={`/posts/${post.slug}`} variant="admin" />
      ))}
    </section>
  );
}
