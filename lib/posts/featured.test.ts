import { describe, expect, it, vi } from "vitest";
import { FEATURED_POST_SLUG, entryType, ENTRY_TYPE_LABEL, getFeaturedPost } from "./featured";

const getPublishedPostBySlugMock = vi.fn();
vi.mock("@/lib/posts/repository/public-posts-repository", () => ({
  getPublishedPostBySlug: (slug: string) => getPublishedPostBySlugMock(slug)
}));

describe("entryType", () => {
  it("classifies the featured slug as a case study", () => {
    expect(entryType(FEATURED_POST_SLUG)).toBe("case-study");
    expect(entryType({ slug: FEATURED_POST_SLUG })).toBe("case-study");
  });
  it("classifies everything else as a field note", () => {
    expect(entryType("some-other-post")).toBe("field-note");
  });
  it("exposes human labels", () => {
    expect(ENTRY_TYPE_LABEL["case-study"]).toBe("Case study");
    expect(ENTRY_TYPE_LABEL["field-note"]).toBe("Field note");
  });
});

const LIST = [
  { id: "1", slug: FEATURED_POST_SLUG, title: "Tree Census", excerpt: null, coverImageUrl: null, status: "published", createdAt: "2026-05-09T00:00:00Z", updatedAt: "2026-05-09T00:00:00Z" },
  { id: "2", slug: "newest-post", title: "Newest", excerpt: null, coverImageUrl: null, status: "published", createdAt: "2026-06-01T00:00:00Z", updatedAt: "2026-06-01T00:00:00Z" }
] as const;

describe("getFeaturedPost", () => {
  it("resolves FEATURED_POST_SLUG and returns reading stats from content", async () => {
    getPublishedPostBySlugMock.mockResolvedValue({
      ok: true,
      data: {
        id: "1", slug: FEATURED_POST_SLUG, title: "Tree Census", excerpt: "dek",
        coverImageUrl: null, status: "published", authorId: null,
        createdAt: "2026-05-09T00:00:00Z", updatedAt: "2026-05-09T00:00:00Z",
        content: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "word ".repeat(400).trim() }] }] }
      }
    });
    const featured = await getFeaturedPost([...LIST]);
    expect(getPublishedPostBySlugMock).toHaveBeenCalledWith(FEATURED_POST_SLUG);
    expect(featured?.slug).toBe(FEATURED_POST_SLUG);
    expect(featured?.minutes).toBeGreaterThanOrEqual(1);
    expect(featured?.words).toBe(400);
  });

  it("falls back to the newest post when the featured slug is absent", async () => {
    getPublishedPostBySlugMock.mockResolvedValue({
      ok: true,
      data: { id: "2", slug: "newest-post", title: "Newest", excerpt: null, coverImageUrl: null, status: "published", authorId: null, createdAt: "2026-06-01T00:00:00Z", updatedAt: "2026-06-01T00:00:00Z", content: { type: "doc", content: [] } }
    });
    const featured = await getFeaturedPost([{ ...LIST[1] }]);
    expect(featured?.slug).toBe("newest-post");
  });

  it("returns null when no posts exist", async () => {
    expect(await getFeaturedPost([])).toBeNull();
  });

  it("returns null when the detail fetch fails", async () => {
    getPublishedPostBySlugMock.mockResolvedValue({ ok: false, error: { message: "db down" } });
    expect(await getFeaturedPost([...LIST])).toBeNull();
  });
});
