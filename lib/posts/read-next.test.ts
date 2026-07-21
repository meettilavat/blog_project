import { describe, expect, it, beforeEach } from "vitest";
import { resolveReadNext, __setReadNextForTest } from "@/lib/posts/read-next";
import type { PostListItem } from "@/lib/posts/contracts/domain/types";

const post = (slug: string, createdAt: string): PostListItem => ({
  id: slug, slug, title: `Title ${slug}`, excerpt: null, coverImageUrl: null,
  status: "published", createdAt, updatedAt: createdAt
});

// newest-first list
const POSTS = [post("c", "2026-06-01"), post("b", "2026-03-01"), post("a", "2026-01-01")];

describe("resolveReadNext", () => {
  beforeEach(() => __setReadNextForTest({}));

  it("returns the configured next post with its why when valid", () => {
    __setReadNextForTest({ b: { nextSlug: "a", why: "The follow-up on the same system." } });
    const r = resolveReadNext("b", POSTS);
    expect(r).toEqual({ label: "Read next", slug: "a", title: "Title a", why: "The follow-up on the same system." });
  });

  it("falls back to Previous when the configured slug does not resolve", () => {
    __setReadNextForTest({ b: { nextSlug: "missing", why: "x" } });
    const r = resolveReadNext("b", POSTS);
    expect(r).toEqual({ label: "Previous", slug: "a", title: "Title a" });
  });

  it("falls back to Previous on a self-link", () => {
    __setReadNextForTest({ b: { nextSlug: "b", why: "x" } });
    const r = resolveReadNext("b", POSTS);
    expect(r?.label).toBe("Previous");
    expect(r?.slug).toBe("a");
  });

  it("falls back to the chronologically previous post when nothing is configured", () => {
    const r = resolveReadNext("b", POSTS);
    expect(r).toEqual({ label: "Previous", slug: "a", title: "Title a" });
  });

  it("returns null for the oldest post with no valid config", () => {
    expect(resolveReadNext("a", POSTS)).toBeNull();
  });
});
