import { beforeEach, describe, expect, it, vi } from "vitest";

const getPublishedPostsMock = vi.fn();
vi.mock("@/lib/posts/repository/public-posts-repository", () => ({
  getPublishedPosts: () => getPublishedPostsMock()
}));
vi.mock("@/lib/site-url", () => ({ getConfiguredSiteUrl: () => "https://www.meettilavat.com" }));

import { GET } from "./route";

const POST = {
  id: "1", slug: "tree-census", title: "Tree <Census> & Co", excerpt: "A & B <i>dek</i>",
  coverImageUrl: null, status: "published", createdAt: "2026-05-09T00:00:00Z", updatedAt: "2026-05-09T00:00:00Z"
};

describe("feed.xml route", () => {
  beforeEach(() => getPublishedPostsMock.mockReset());

  it("returns RSS 2.0 with the correct content type", async () => {
    getPublishedPostsMock.mockResolvedValue({ ok: true, data: [POST] });
    const res = await GET();
    expect(res.headers.get("content-type")).toContain("application/rss+xml");
    const xml = await res.text();
    expect(xml).toContain("<rss version=\"2.0\">");
    expect(xml).toContain("<title>Meet Tilavat</title>");
  });

  it("emits one item per post with absolute link, guid, pubDate, escaped description", async () => {
    getPublishedPostsMock.mockResolvedValue({ ok: true, data: [POST] });
    const xml = await (await GET()).text();
    expect(xml).toContain("https://www.meettilavat.com/posts/tree-census");
    expect(xml).toContain("<guid isPermaLink=\"true\">https://www.meettilavat.com/posts/tree-census</guid>");
    expect(xml).toContain("Tree &lt;Census&gt; &amp; Co");
    expect(xml).toContain("A &amp; B &lt;i&gt;dek&lt;/i&gt;");
    expect(xml).toMatch(/<pubDate>.*2026.*<\/pubDate>/);
  });

  it("falls back when excerpt is null", async () => {
    getPublishedPostsMock.mockResolvedValue({ ok: true, data: [{ ...POST, excerpt: null }] });
    const xml = await (await GET()).text();
    expect(xml).toContain("Read the latest post from Meet Tilavat.");
  });

  it("returns 503 plain text when the repository fails", async () => {
    getPublishedPostsMock.mockResolvedValue({ ok: false, error: { message: "db down" } });
    const res = await GET();
    expect(res.status).toBe(503);
    expect(res.headers.get("content-type")).toContain("text/plain");
  });
});
