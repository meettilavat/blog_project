import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import StartHere from "@/components/home/start-here";
import { START_HERE } from "@/lib/posts/start-here";
import type { PostListItem } from "@/lib/posts/contracts/domain/types";

const post = (slug: string): PostListItem => ({
  id: slug, slug, title: `Title ${slug}`, excerpt: null, coverImageUrl: null,
  status: "published", createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z"
});

describe("components/home/start-here.tsx", () => {
  it("renders the three picks with their why lines", () => {
    const posts = START_HERE.map((p) => post(p.slug));
    const html = renderToStaticMarkup(<StartHere posts={posts} />);
    expect(html).toContain("Start here");
    for (const pick of START_HERE) {
      expect(html).toContain(pick.why);
      expect(html).toContain(`href="/posts/${pick.slug}"`);
    }
  });

  it("renders nothing when fewer than three resolve", () => {
    const posts = [post(START_HERE[0].slug)];
    const html = renderToStaticMarkup(<StartHere posts={posts} />);
    expect(html).toBe("");
  });
});
