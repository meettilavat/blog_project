import type { PostListItem } from "@/lib/posts/contracts/domain/types";

export type ReadNextEntry = { nextSlug: string; why: string };

// Owner-authored per post (content, not code). Map current post slug -> the
// recommended next post. Absent/invalid/self-link -> chronological "Previous".
export const READ_NEXT: Record<string, ReadNextEntry> = {};

// Test hook to inject a config without touching the authored map.
let override: Record<string, ReadNextEntry> | null = null;
export function __setReadNextForTest(map: Record<string, ReadNextEntry>) {
  override = map;
}

export type ResolvedReadNext = {
  label: "Read next" | "Previous";
  slug: string;
  title: string;
  why?: string;
};

export function resolveReadNext(currentSlug: string, posts: PostListItem[]): ResolvedReadNext | null {
  const config = override ?? READ_NEXT;
  const bySlug = new Map(posts.map((p) => [p.slug, p]));

  const configured = config[currentSlug];
  if (configured && configured.nextSlug !== currentSlug) {
    const target = bySlug.get(configured.nextSlug);
    if (target) {
      return { label: "Read next", slug: target.slug, title: target.title, why: configured.why };
    }
  }

  // Chronological previous (posts are newest-first).
  const index = posts.findIndex((p) => p.slug === currentSlug);
  const previous = index >= 0 ? posts[index + 1] : undefined;
  return previous ? { label: "Previous", slug: previous.slug, title: previous.title } : null;
}
