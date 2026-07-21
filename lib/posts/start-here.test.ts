import { describe, expect, it } from "vitest";
import { START_HERE, resolveStartHere } from "@/lib/posts/start-here";
import type { PostListItem } from "@/lib/posts/contracts/domain/types";

const post = (slug: string): PostListItem => ({
  id: slug, slug, title: `Title ${slug}`, excerpt: null, coverImageUrl: null,
  status: "published", createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z"
});

describe("start-here contract", () => {
  it("declares exactly three picks", () => {
    expect(START_HERE).toHaveLength(3);
    for (const pick of START_HERE) {
      expect(typeof pick.slug).toBe("string");
      expect(typeof pick.why).toBe("string");
      expect(pick.why.length).toBeGreaterThan(0);
    }
  });

  it("resolves only picks whose slug is published", () => {
    const slugs = START_HERE.map((p) => p.slug);
    const posts = slugs.map(post);
    const resolved = resolveStartHere(posts);
    expect(resolved).toHaveLength(3);
    expect(resolved.map((r) => r.slug)).toEqual(slugs);
  });

  it("hides the whole section when fewer than three resolve", () => {
    const posts = [post(START_HERE[0].slug), post(START_HERE[1].slug)];
    expect(resolveStartHere(posts)).toEqual([]);
  });
});
