import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/components/content/rich-text/rich-text-viewer", () => ({
  default: ({ className }: { className?: string }) => <div className={className}>RichTextViewerStub</div>
}));

vi.mock("@/components/content/chrome/table-of-contents", () => ({
  default: ({ variant, className }: { variant?: string; className?: string }) => (
    <aside data-toc-variant={variant} className={className}>TableOfContentsStub</aside>
  )
}));

vi.mock("@/components/posts/post-cover-media", () => ({
  default: ({ alt }: { alt: string }) => <div role="img" aria-label={alt}>PostCoverMediaStub</div>
}));

import { PostDetailArticle } from "./post-detail-article";

describe("components/posts/post-detail-article.tsx", () => {
  it("uses a broad editorial measure inside a bounded marginalia canvas", () => {
    const html = renderToStaticMarkup(
      <PostDetailArticle
        title="A field report"
        excerpt="A concise report from production."
        coverImageUrl="/cover.png"
        content={{ type: "doc", content: [] }}
        headings={[{ id: "intro", text: "Introduction", level: 2 }]}
        reading={{ minutes: 4, words: 820 }}
        createdAt="2024-01-01T00:00:00.000Z"
        updatedAt="2024-01-01T00:00:00.000Z"
        publishedPrefix="Published"
      />
    );

    expect(html).toContain("journal-article-canvas");
    expect(html).toContain("max-w-[56rem]");
    expect(html).not.toContain("max-w-[44rem]");
    expect(html).toContain("max-w-[64rem]");
    expect(html).not.toContain("max-w-[72ch]");
    expect(html).toContain("space-y-[clamp(2.5rem,4vw,4rem)]");
    expect(html).toContain("marginalia:grid-cols-[14rem_minmax(0,56rem)_14rem]");
    expect(html).toContain("marginalia:justify-center");
    expect(html).toContain("marginalia:gap-x-6");
    expect(html).not.toContain("marginalia:gap-x-8");
    expect(html).not.toContain("marginalia:grid-cols-[minmax(0,1fr)_minmax(0,72ch)_14rem]");
    expect(html).not.toContain("space-y-[clamp(2.75rem,6vw,5.5rem)]");
    expect(html).toContain("marginalia:grid");
    expect(html).toContain("marginalia:block");
    expect(html).toContain("aspect-[16/9]");
    expect(html).not.toContain("max-h-[68vh]");
    expect(html).not.toContain("calc(100vw");
    expect(html).not.toContain("left-1/2");
    expect(html).not.toContain("2xl:");
  });

  it("renders the entry-type eyebrow and end-of-entry colophon", () => {
    const html = renderToStaticMarkup(
      <PostDetailArticle
        title="A field report"
        excerpt="A concise report from production."
        coverImageUrl="/cover.png"
        content={{ type: "doc", content: [] }}
        headings={[{ id: "intro", text: "Introduction", level: 2 }]}
        reading={{ minutes: 4, words: 820 }}
        createdAt="2024-01-01T00:00:00.000Z"
        updatedAt="2024-01-01T00:00:00.000Z"
        publishedPrefix="Published"
        eyebrow="Case study"
      />
    );

    expect(html).toContain("Case study");
    expect(html).toContain("End of entry");
  });
});
