import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import WritingIndex from "@/components/home/writing-index";
import type { PostListItem } from "@/lib/posts/contracts/domain/types";

const post = (slug: string, excerpt: string | null, createdAt: string): PostListItem => ({
  id: slug, slug, title: `Title ${slug}`, excerpt, coverImageUrl: null,
  status: "published", createdAt, updatedAt: createdAt
});

describe("components/home/writing-index.tsx", () => {
  const posts = [
    post("b", "A dek", "2026-06-01T00:00:00Z"),
    post("a", null, "2026-01-01T00:00:00Z")
  ];

  it("renders one link row per post with date and title", () => {
    const html = renderToStaticMarkup(<WritingIndex posts={posts} />);
    expect(html).toContain("All writing");
    expect(html).toContain("2 posts");
    expect(html).toContain('href="/posts/b"');
    expect(html).toContain('href="/posts/a"');
    expect(html).toContain("Title b");
  });

  it("renders the dek only when an excerpt exists", () => {
    const html = renderToStaticMarkup(<WritingIndex posts={posts} />);
    expect(html).toContain("A dek");
    // post "a" has no excerpt; row must still be complete without a dek node.
    expect(html).not.toContain("undefined");
  });
});
