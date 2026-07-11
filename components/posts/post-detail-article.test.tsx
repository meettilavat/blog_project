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

vi.mock("@/components/motion/fade-in", () => ({
  FadeIn: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

vi.mock("@/components/posts/post-cover-media", () => ({
  default: ({ alt }: { alt: string }) => <div role="img" aria-label={alt}>PostCoverMediaStub</div>
}));

import { PostDetailArticle } from "./post-detail-article";

describe("components/posts/post-detail-article.tsx", () => {
  it("keeps prose narrow inside a bounded marginalia canvas", () => {
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
    expect(html).toContain("max-w-[72ch]");
    expect(html).toContain("marginalia:grid");
    expect(html).toContain("marginalia:block");
    expect(html).toContain("aspect-[16/9]");
    expect(html).not.toContain("max-h-[68vh]");
    expect(html).not.toContain("calc(100vw");
    expect(html).not.toContain("left-1/2");
    expect(html).not.toContain("2xl:");
  });
});
