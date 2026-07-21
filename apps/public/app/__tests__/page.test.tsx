import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  DEFAULT_SOCIAL_IMAGE_PATH,
  HOME_PAGE_DESCRIPTION,
  HOME_PAGE_TITLE
} from "@/lib/seo/public-site";
import type { PostListItem } from "@/lib/posts/contracts/domain/types";
import type { FeaturedPost } from "@/lib/posts/featured";

const { SITE_URL } = vi.hoisted(() => ({
  SITE_URL: "https://www.meettilavat.com"
}));

const getPublishedPostsMock = vi.fn();
const getFeaturedPostMock = vi.fn();

vi.mock("@/lib/posts/repository/public-posts-repository", () => ({
  getPublishedPosts: () => getPublishedPostsMock()
}));

vi.mock("@/lib/posts/featured", () => ({
  getFeaturedPost: (posts: PostListItem[]) => getFeaturedPostMock(posts)
}));

vi.mock("@/lib/site-url", () => ({
  getConfiguredSiteUrl: () => SITE_URL
}));

vi.mock("@/components/home/hero", () => ({
  default: ({ featured, isLatest }: { featured: FeaturedPost; isLatest: boolean }) => (
    <div data-testid="hero-stub" data-slug={featured.slug} data-is-latest={String(isLatest)} />
  )
}));

vi.mock("@/components/home/start-here", () => ({
  default: ({ posts }: { posts: PostListItem[] }) => (
    <div data-testid="start-here-stub" data-count={posts.length} />
  )
}));

vi.mock("@/components/home/writing-index", () => ({
  default: ({ posts }: { posts: PostListItem[] }) => (
    <div data-testid="writing-index-stub" data-count={posts.length} />
  )
}));

import HomePage, { metadata } from "../page";

const post = (slug: string, createdAt: string): PostListItem => ({
  id: slug, slug, title: `Title ${slug}`, excerpt: null, coverImageUrl: null,
  status: "published", createdAt, updatedAt: createdAt
});

const featured = (slug: string): FeaturedPost => ({
  slug, title: `Title ${slug}`, excerpt: null,
  createdAt: "2026-06-01T00:00:00Z", updatedAt: "2026-06-01T00:00:00Z",
  minutes: 4, words: 800
});

describe("apps/public/app/page.tsx", () => {
  beforeEach(() => {
    getPublishedPostsMock.mockReset();
    getFeaturedPostMock.mockReset();
  });

  it("exports homepage metadata tuned for search and social sharing", () => {
    expect(metadata.title).toBe(HOME_PAGE_TITLE);
    expect(metadata.description).toBe(HOME_PAGE_DESCRIPTION);
    expect(metadata.alternates?.canonical).toBe("/");
    expect(metadata.openGraph?.url).toBe(SITE_URL);
    expect(metadata.twitter?.images).toEqual([DEFAULT_SOCIAL_IMAGE_PATH]);
  });

  it("renders hero, start-here, and writing index when posts resolve", async () => {
    const posts = [
      post("tree-census", "2026-06-01T00:00:00Z"),
      post("note-a", "2025-12-01T00:00:00Z")
    ];
    getPublishedPostsMock.mockResolvedValue({ ok: true, data: posts });
    getFeaturedPostMock.mockResolvedValue(featured("tree-census"));

    const html = renderToStaticMarkup(await HomePage());

    expect(html).toContain('data-testid="hero-stub"');
    expect(html).toContain('data-slug="tree-census"');
    expect(html).toContain('data-is-latest="true"');
    expect(html).toContain('data-testid="start-here-stub"');
    expect(html).toContain('data-testid="writing-index-stub"');
    expect(html).toContain('data-count="2"');
    expect(getFeaturedPostMock).toHaveBeenCalledWith(posts);
  });

  it("marks the hero as not-latest when the featured post is older than the newest post", async () => {
    const posts = [
      post("note-new", "2026-06-01T00:00:00Z"),
      post("tree-census", "2025-12-01T00:00:00Z")
    ];
    getPublishedPostsMock.mockResolvedValue({ ok: true, data: posts });
    getFeaturedPostMock.mockResolvedValue(featured("tree-census"));

    const html = renderToStaticMarkup(await HomePage());

    expect(html).toContain('data-testid="hero-stub"');
    expect(html).toContain('data-is-latest="false"');
  });

  it("renders the empty state without hero or index when no posts exist", async () => {
    getPublishedPostsMock.mockResolvedValue({ ok: true, data: [] });

    const html = renderToStaticMarkup(await HomePage());

    expect(html).toContain("No posts yet.");
    expect(html).toContain("Fresh writing is on the way.");
    expect(html).toContain("Meet Tilavat");
    expect(html).not.toContain('data-testid="hero-stub"');
    expect(html).not.toContain('data-testid="start-here-stub"');
    expect(html).not.toContain('data-testid="writing-index-stub"');
    expect(getFeaturedPostMock).not.toHaveBeenCalled();
    expect(html).toContain("application/ld+json");
    expect(html).toContain("\"@type\":\"WebSite\"");
    expect(html).toContain(`\"url\":\"${SITE_URL}\"`);
  });

  it("renders the writing index without a hero when posts exist but no featured post resolves", async () => {
    const posts = [post("note-a", "2026-06-01T00:00:00Z")];
    getPublishedPostsMock.mockResolvedValue({ ok: true, data: posts });
    getFeaturedPostMock.mockResolvedValue(null);

    const html = renderToStaticMarkup(await HomePage());

    expect(html).not.toContain("No posts yet.");
    expect(html).not.toContain('data-testid="hero-stub"');
    expect(html).toContain('data-testid="start-here-stub"');
    expect(html).toContain('data-testid="writing-index-stub"');
  });

  it("renders a distinct availability error when posts cannot be loaded", async () => {
    getPublishedPostsMock.mockResolvedValue({
      ok: false,
      error: { message: "database unavailable" }
    });

    const html = renderToStaticMarkup(await HomePage());

    expect(html).toContain("Writing is temporarily unavailable");
    expect(html).toContain("Please try again shortly");
    expect(html).not.toContain("No posts yet.");
    expect(html).not.toContain('data-testid="hero-stub"');
    expect(getFeaturedPostMock).not.toHaveBeenCalled();
  });
});
