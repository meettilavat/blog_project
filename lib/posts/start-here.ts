import type { PostListItem } from "@/lib/posts/contracts/domain/types";

export type StartHerePick = { slug: string; why: string };

// Owner-authored at implementation time (content, not code). Exactly three,
// each slug a published post. The picks below are placeholders the site owner
// replaces with real essays + one-line reasons before release (Task 18 audit).
export const START_HERE: StartHerePick[] = [
  { slug: "building-tree-census-a-django-and-next-js-platform-from-local-dev-to-production-on-gcp", why: "The full production build, from local dev to GCP." },
  { slug: "building-tree-census-a-django-and-next-js-platform-from-local-dev-to-production-on-gcp", why: "Replace with a second real pick and its one-line reason." },
  { slug: "building-tree-census-a-django-and-next-js-platform-from-local-dev-to-production-on-gcp", why: "Replace with a third real pick and its one-line reason." }
];

export type ResolvedStartHere = { slug: string; title: string; why: string };

export function resolveStartHere(posts: PostListItem[]): ResolvedStartHere[] {
  // Each pick must claim a distinct post entry: while the placeholder picks
  // share one slug, N provided copies of that post resolve only N picks, so
  // the section stays hidden until three real, distinct essays are in place.
  const used = new Set<number>();
  const resolved = START_HERE.map((pick) => {
    const index = posts.findIndex((p, i) => !used.has(i) && p.slug === pick.slug);
    if (index === -1) return null;
    used.add(index);
    const post = posts[index];
    return { slug: post.slug, title: post.title, why: pick.why };
  }).filter((r): r is ResolvedStartHere => r !== null);
  return resolved.length === 3 ? resolved : [];
}
