import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/dynamic", () => ({
  default: () => () => <canvas data-field-stub aria-hidden="true" />
}));

import Hero from "@/components/home/hero";

const FEATURED = {
  slug: "tree-census",
  title: "Building a tree census platform",
  excerpt: "dek",
  createdAt: "2026-05-09T00:00:00Z",
  updatedAt: "2026-05-09T00:00:00Z",
  minutes: 9,
  words: 1800
};

describe("components/home/hero.tsx", () => {
  it("renders eyebrow, positioning line, and the title as a link to the essay", async () => {
    const html = renderToStaticMarkup(await Hero({ featured: FEATURED, isLatest: false }));
    expect(html).toContain("Meet Tilavat");
    expect(html).toContain("Production lessons from running my own stack");
    expect(html).toContain('href="/posts/tree-census"');
    expect(html).toContain("Building a tree census platform");
    expect(html).toContain("Featured");
    expect(html).toContain("9 min read");
  });

  it("reads 'Latest' when the featured post is also newest", async () => {
    const html = renderToStaticMarkup(await Hero({ featured: FEATURED, isLatest: true }));
    expect(html).toContain("Latest");
  });
});
