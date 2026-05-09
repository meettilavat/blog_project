import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { notFound } from "next/navigation";

const getPostBySlugMock = vi.fn();
const analyzeContentMock = vi.fn();
const readingProgressRenderMock = vi.fn(() => <div>ReadingProgressStub</div>);
const tableOfContentsRenderMock = vi.fn((props: { headings: unknown[] }) => (
  <div>{`TableOfContentsStub:${props.headings.length}`}</div>
));
const richTextViewerRenderMock = vi.fn((props: { content: { type: string }; className?: string }) => (
  <div>{`RichTextViewerStub:${props.content.type}`}</div>
));
const postCoverMediaRenderMock = vi.fn((props: { src?: string; alt: string }) => (
  <div>{`PostCoverMediaStub:${props.src ?? "none"}:${props.alt}`}</div>
));
const postMetaRowRenderMock = vi.fn((props: { createdAt: string; updatedAt: string }) => (
  <div>{`PostMetaRowStub:${props.createdAt}:${props.updatedAt}`}</div>
));

vi.mock("@/lib/posts/repository/admin-posts-repository", () => ({
  getPostBySlug: (slug: string) => getPostBySlugMock(slug)
}));

vi.mock("@/lib/tiptap/content-pipeline", () => ({
  analyzeContent: (content: unknown) => analyzeContentMock(content)
}));

vi.mock("@/components/content/rich-text/rich-text-viewer", () => ({
  default: (props: { content: { type: string }; className?: string }) => richTextViewerRenderMock(props)
}));

vi.mock("@/components/content/chrome/table-of-contents", () => ({
  default: (props: { headings: unknown[] }) => tableOfContentsRenderMock(props)
}));

vi.mock("@/components/content/chrome/reading-progress", () => ({
  ReadingProgress: () => readingProgressRenderMock()
}));

vi.mock("@/components/posts/post-cover-media", () => ({
  default: (props: { src?: string; alt: string }) => postCoverMediaRenderMock(props)
}));

vi.mock("@/components/posts/post-meta-row", () => ({
  default: (props: { createdAt: string; updatedAt: string }) => postMetaRowRenderMock(props)
}));

import PostPage from "./page";

describe("apps/admin/app/(public)/posts/[slug]/page.tsx", () => {
  beforeEach(() => {
    getPostBySlugMock.mockReset();
    analyzeContentMock.mockReset();
    readingProgressRenderMock.mockClear();
    tableOfContentsRenderMock.mockClear();
    richTextViewerRenderMock.mockClear();
    postCoverMediaRenderMock.mockClear();
    postMetaRowRenderMock.mockClear();
    vi.mocked(notFound).mockClear();
  });

  it("throws the repository error when post fetch fails", async () => {
    getPostBySlugMock.mockResolvedValue({
      ok: false,
      error: { message: "fetch failed" }
    });

    await expect(
      PostPage({
        params: Promise.resolve({ slug: "broken-post" })
      })
    ).rejects.toThrow("fetch failed");
  });

  it("calls notFound when the post is missing", async () => {
    getPostBySlugMock.mockResolvedValue({
      ok: true,
      data: null
    });

    await expect(
      PostPage({
        params: Promise.resolve({ slug: "draft-post" })
      })
    ).rejects.toThrow("notFound");

    expect(notFound).toHaveBeenCalledTimes(1);
  });

  it("renders a draft preview banner for unpublished posts", async () => {
    getPostBySlugMock.mockResolvedValue({
      ok: true,
      data: {
        id: "post-1",
        slug: "draft-post",
        status: "draft",
        title: "Draft post",
        coverImageUrl: "/cover.png",
        content: { type: "doc", content: [] },
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-02T00:00:00.000Z"
      }
    });
    analyzeContentMock.mockReturnValue({
      headings: [],
      reading: { words: 120, minutes: 1 },
      content: { type: "doc", content: [] }
    });

    const html = renderToStaticMarkup(
      await PostPage({
        params: Promise.resolve({ slug: "draft-post" })
      })
    );

    expect(html).toContain("Draft preview");
    expect(html).toContain("/editor/draft-post");
    expect(html).toContain("Draft post");
  });

  it("renders post metadata, toc, and rich text for a published post", async () => {
    getPostBySlugMock.mockResolvedValue({
      ok: true,
      data: {
        id: "post-1",
        slug: "published-post",
        status: "published",
        title: "Published post",
        coverImageUrl: "/cover.png",
        content: { type: "doc", content: [] },
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-02T00:00:00.000Z"
      }
    });
    analyzeContentMock.mockReturnValue({
      headings: [{ id: "intro", text: "Intro", level: 2 }],
      reading: { words: 120, minutes: 1 },
      content: { type: "doc", content: [] }
    });

    const html = renderToStaticMarkup(
      await PostPage({
        params: Promise.resolve({ slug: "published-post" })
      })
    );

    expect(getPostBySlugMock).toHaveBeenCalledWith("published-post");
    expect(analyzeContentMock).toHaveBeenCalledWith({ type: "doc", content: [] });
    expect(html).toContain("Published post");
    expect(html).toContain("ReadingProgressStub");
    expect(html).toContain("PostCoverMediaStub:/cover.png:Published post");
    expect(html).toContain("PostMetaRowStub:2024-01-01T00:00:00.000Z:2024-01-02T00:00:00.000Z");
    expect(html).toContain("TableOfContentsStub:1");
    expect(html).toContain("RichTextViewerStub:doc");
    expect(richTextViewerRenderMock).toHaveBeenCalledWith(
      expect.objectContaining({ className: "tiptap-editorial mx-0 max-w-none" })
    );
  });
});
