import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  DEFAULT_SOCIAL_IMAGE_PATH,
  HOME_PAGE_DESCRIPTION,
  HOME_PAGE_TITLE
} from "@/lib/seo/public-site";

const { SITE_URL } = vi.hoisted(() => ({
  SITE_URL: "https://www.meettilavat.com"
}));

const getPublishedPostsMock = vi.fn();

vi.mock("@/lib/posts/repository/public-posts-repository", () => ({
  getPublishedPosts: () => getPublishedPostsMock()
}));

vi.mock("@/lib/site-url", () => ({
  getConfiguredSiteUrl: () => SITE_URL
}));

import HomePage, { metadata } from "../page";

describe("apps/public/app/page.tsx", () => {
  beforeEach(() => {
    getPublishedPostsMock.mockReset();
  });

  it("exports homepage metadata tuned for search and social sharing", () => {
    expect(metadata.title).toBe(HOME_PAGE_TITLE);
    expect(metadata.description).toBe(HOME_PAGE_DESCRIPTION);
    expect(metadata.alternates?.canonical).toBe("/");
    expect(metadata.openGraph?.url).toBe(SITE_URL);
    expect(metadata.twitter?.images).toEqual([DEFAULT_SOCIAL_IMAGE_PATH]);
  });

  it("renders empty-state content when no posts are available", async () => {
    getPublishedPostsMock.mockResolvedValue({
      ok: true,
      data: []
    });

    const html = renderToStaticMarkup(await HomePage());

    expect(html).toContain("No posts yet.");
    expect(html).toContain("Fresh writing is on the way.");
    expect(html).toContain("application/ld+json");
    expect(html).toContain("\"@type\":\"WebSite\"");
    expect(html).toContain(`\"url\":\"${SITE_URL}\"`);
  });

  it("renders links to posts when posts exist", async () => {
    getPublishedPostsMock.mockResolvedValue({ ok: true, data: [
      { id: "1", slug: "tree-census", title: "Tree Census", createdAt: "2026-05-09T00:00:00Z", updatedAt: "2026-05-09T00:00:00Z", excerpt: null, coverImageUrl: null, status: "published" },
      { id: "2", slug: "note-a", title: "Note A", createdAt: "2025-12-01T00:00:00Z", updatedAt: "2025-12-01T00:00:00Z", excerpt: null, coverImageUrl: null, status: "published" }
    ]});
    const html = renderToStaticMarkup(await HomePage());
    expect(html).toContain('/posts/tree-census');
    expect(html).toContain('Tree Census');
    expect(html).toContain('/posts/note-a');
    expect(html).toContain('Note A');
  });

  it("renders a distinct availability error when posts cannot be loaded", async () => {
    getPublishedPostsMock.mockResolvedValue({
      ok: false,
      error: { message: "database unavailable" }
    });

    const html = renderToStaticMarkup(await HomePage());

    expect(html).toContain("Writing is temporarily unavailable");
    expect(html).toContain("Please try again shortly");
    expect(html).not.toContain("No posts yet. Fresh writing is on the way.");
  });
});
