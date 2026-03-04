import { afterEach, describe, expect, it, vi } from "vitest";

const { getConfiguredSiteUrlMock, getPublishedPostsMock } = vi.hoisted(() => ({
  getConfiguredSiteUrlMock: vi.fn(),
  getPublishedPostsMock: vi.fn()
}));

vi.mock("@/lib/site-url", () => ({
  getConfiguredSiteUrl: getConfiguredSiteUrlMock
}));

vi.mock("@/lib/posts/repository/public-posts-repository", () => ({
  getPublishedPosts: getPublishedPostsMock
}));

import sitemap from "./sitemap";

const HTTPS_PROTOCOL = "https";
const SITE_HOST = "meettilavat.com";
const SITE_URL = `${HTTPS_PROTOCOL}://${SITE_HOST}`;

describe("apps/public/app/sitemap.ts", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("builds sitemap entries for static routes and published posts", async () => {
    getConfiguredSiteUrlMock.mockReturnValue(SITE_URL);
    getPublishedPostsMock.mockResolvedValue({
      ok: true,
      data: [
        {
          slug: "first-post",
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-02T00:00:00.000Z"
        }
      ]
    });

    const entries = await sitemap();

    expect(entries).toHaveLength(3);
    expect(entries[0]).toMatchObject({
      url: SITE_URL,
      changeFrequency: "weekly",
      priority: 1
    });
    expect(entries[1]).toMatchObject({
      url: `${SITE_URL}/resume`
    });
    expect(entries[2]).toMatchObject({
      url: `${SITE_URL}/posts/first-post`,
      changeFrequency: "monthly",
      priority: 0.8
    });
  });

  it("returns empty sitemap when base url is unavailable", async () => {
    getConfiguredSiteUrlMock.mockReturnValue(null);
    getPublishedPostsMock.mockResolvedValue({ ok: true, data: [] });

    expect(await sitemap()).toEqual([]);
  });
});
