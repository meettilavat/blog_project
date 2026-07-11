import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { notFound } from "next/navigation";
import { POST_DESCRIPTION_FALLBACK } from "@/lib/seo/public-site";

const HTTPS_PROTOCOL = "https://";
const SITE_DOMAIN = "www.meettilavat.com";
const SITE_URL = `${HTTPS_PROTOCOL}${SITE_DOMAIN}`;
const REMOTE_COVER_IMAGE_URL = [HTTPS_PROTOCOL, "images.example.com", "/cover.png"].join("");

let configuredSiteUrl = SITE_URL;
const getPublishedPostsMock = vi.fn();
const getPublishedPostBySlugMock = vi.fn();
const analyzeContentMock = vi.fn();
const readingProgressRenderMock = vi.fn(() => <div>ReadingProgressStub</div>);
const postCoverMediaRenderMock = vi.fn((props: { src?: string; alt: string }) => (
  <div>{`PostCoverMediaStub:${props.src ?? "none"}:${props.alt}`}</div>
));
const postMetaRowRenderMock = vi.fn((props: { createdAt: string; updatedAt: string }) => (
  <div>{`PostMetaRowStub:${props.createdAt}:${props.updatedAt}`}</div>
));
const richTextViewerRenderMock = vi.fn((props: { content: { type: string }; className?: string; isSanitized?: boolean }) => (
  <div>{`RichTextViewerStub:${props.content.type}`}</div>
));
const tableOfContentsRenderMock = vi.fn((props: { headings: unknown[] }) => (
  <div>{`TableOfContentsStub:${props.headings.length}`}</div>
));

vi.mock("@/lib/posts/repository/public-posts-repository", () => ({
  getPublishedPosts: () => getPublishedPostsMock(),
  getPublishedPostBySlug: (slug: string) => getPublishedPostBySlugMock(slug)
}));

vi.mock("@/lib/tiptap/content-pipeline", () => ({
  analyzeContent: (content: unknown) => analyzeContentMock(content)
}));

vi.mock("@/lib/site-url", () => ({
  getConfiguredSiteUrl: () => configuredSiteUrl
}));

vi.mock("@/components/content/rich-text/rich-text-viewer", () => ({
  default: (props: { content: { type: string }; className?: string; isSanitized?: boolean }) => richTextViewerRenderMock(props)
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

vi.mock("@/components/motion/fade-in", () => ({
  FadeIn: ({ children }: { children: React.ReactNode }) => <section>{children}</section>
}));

import PostPage, { generateMetadata, generateStaticParams } from "./page";

describe("apps/public/app/posts/[slug]/page.tsx", () => {
  it("defines a route-local editorial missing-post shell", () => {
    const routeNotFoundPath = path.join(process.cwd(), "apps/public/app/posts/[slug]/not-found.tsx");

    expect(existsSync(routeNotFoundPath)).toBe(true);
    const source = readFileSync(routeNotFoundPath, "utf8");
    expect(source).toContain("PublicStatusNotice");
    expect(source).toContain("Missing field note");
  });

  beforeEach(() => {
    configuredSiteUrl = SITE_URL;
    getPublishedPostsMock.mockReset();
    getPublishedPostBySlugMock.mockReset();
    analyzeContentMock.mockReset();
    readingProgressRenderMock.mockClear();
    postCoverMediaRenderMock.mockClear();
    postMetaRowRenderMock.mockClear();
    richTextViewerRenderMock.mockClear();
    tableOfContentsRenderMock.mockClear();
    vi.mocked(notFound).mockClear();
  });

  it("returns post slugs from generateStaticParams", async () => {
    getPublishedPostsMock.mockResolvedValue({
      ok: true,
      data: [{ slug: "first-post" }, { slug: "second-post" }]
    });

    await expect(generateStaticParams()).resolves.toEqual([
      { slug: "first-post" },
      { slug: "second-post" }
    ]);
  });

  it("returns empty metadata when the post cannot be loaded", async () => {
    getPublishedPostBySlugMock.mockResolvedValue({
      ok: false,
      error: { message: "missing" }
    });

    await expect(
      generateMetadata({
        params: Promise.resolve({ slug: "missing-post" })
      })
    ).resolves.toEqual({});
  });

  it("builds metadata from post content and configured site url", async () => {
    getPublishedPostBySlugMock.mockResolvedValue({
      ok: true,
      data: {
        title: "My Post",
        excerpt: "",
        content: { type: "doc", content: [] },
        coverImageUrl: REMOTE_COVER_IMAGE_URL
      }
    });
    analyzeContentMock.mockReturnValue({
      plainText: "Generated plain text summary for metadata generation.",
      headings: [],
      reading: { minutes: 1 },
      content: { type: "doc" }
    });

    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: "my-post" })
    });

    expect(metadata.title).toBe("My Post");
    expect(metadata.description).toContain("Generated plain text summary");
    expect(metadata.alternates?.canonical).toBe("/posts/my-post");
    expect(metadata.openGraph?.url).toBe(`${SITE_URL}/posts/my-post`);
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image" });
  });

  it("falls back to the default post description when excerpt and plain text are empty", async () => {
    getPublishedPostBySlugMock.mockResolvedValue({
      ok: true,
      data: {
        title: "Empty Post",
        excerpt: "",
        content: { type: "doc", content: [] },
        coverImageUrl: null
      }
    });
    analyzeContentMock.mockReturnValue({
      plainText: "",
      headings: [],
      reading: { minutes: 1 },
      content: { type: "doc" }
    });

    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: "empty-post" })
    });

    expect(metadata.description).toBe(POST_DESCRIPTION_FALLBACK);
  });

  it("throws when published post loading fails", async () => {
    getPublishedPostBySlugMock.mockResolvedValue({
      ok: false,
      error: { message: "failed to load post" }
    });

    await expect(
      PostPage({
        params: Promise.resolve({ slug: "broken-post" })
      })
    ).rejects.toThrow("failed to load post");
  });

  it("calls notFound when post is missing", async () => {
    getPublishedPostBySlugMock.mockResolvedValue({
      ok: true,
      data: null
    });

    await expect(
      PostPage({
        params: Promise.resolve({ slug: "missing-post" })
      })
    ).rejects.toThrow("notFound");

    expect(notFound).toHaveBeenCalledTimes(1);
  });

  it("renders post page content for a published post with headings", async () => {
    getPublishedPostBySlugMock.mockResolvedValue({
      ok: true,
      data: {
        title: "Published Post",
        slug: "published-post",
        coverImageUrl: "/cover.png",
        content: { type: "doc", content: [] },
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-02T00:00:00.000Z"
      }
    });
    analyzeContentMock.mockReturnValue({
      plainText: "Published post plain text",
      headings: [{ id: "intro", level: 2, text: "Intro" }],
      reading: { words: 120, minutes: 1 },
      content: { type: "doc", content: [] }
    });

    const html = renderToStaticMarkup(
      await PostPage({
        params: Promise.resolve({ slug: "published-post" })
      })
    );

    expect(getPublishedPostBySlugMock).toHaveBeenCalledWith("published-post");
    expect(analyzeContentMock).toHaveBeenCalledWith({ type: "doc", content: [] });
    expect(readingProgressRenderMock).toHaveBeenCalledTimes(1);
    expect(html).toContain("Back to posts");
    expect(html).toContain("Published Post");
    expect(html).toContain("PostCoverMediaStub:/cover.png:Published Post");
    expect(html).toContain("PostMetaRowStub:2024-01-01T00:00:00.000Z:2024-01-02T00:00:00.000Z");
    expect(html).toContain("RichTextViewerStub:doc");
    expect(html).toContain("TableOfContentsStub:1");
    expect(html.indexOf("<h1")).toBeLessThan(html.indexOf("PostCoverMediaStub"));
    expect(richTextViewerRenderMock).toHaveBeenCalledWith(
      expect.objectContaining({
        className: "tiptap-editorial mx-0 max-w-none",
        isSanitized: true
      })
    );
    expect(html).toContain("max-w-[56rem]");
    expect(html).not.toContain("max-w-[44rem]");
    expect(html).not.toContain("max-w-[72ch]");
    expect(html).not.toContain("max-w-[82ch]");
    expect(html).toContain(
      "marginalia:grid-cols-[14rem_minmax(0,56rem)_14rem]"
    );
    expect(html).toContain("marginalia:justify-center");
    expect(html).toContain("marginalia:gap-x-6");
    expect(html).not.toContain("marginalia:gap-x-8");
    expect(html.match(/max-w-\[64rem\]/g)).toHaveLength(2);
    expect(html.match(/max-w-\[48rem\]/g)).toHaveLength(1);
    expect(tableOfContentsRenderMock).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: "rail",
        className:
          "hidden marginalia:sticky marginalia:col-start-3 marginalia:block marginalia:w-full"
      })
    );
    expect(html).toContain("max-w-[64rem]");
    expect(html).toContain("application/ld+json");
    expect(html).toContain("\"@type\":\"BlogPosting\"");
    expect(html).toContain(`\"url\":\"${SITE_URL}/posts/published-post\"`);
  });
});
