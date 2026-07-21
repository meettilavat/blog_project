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
  it("places every text block in one centred column with a wider media band", () => {
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

    // One text column (43rem) carries back link, meta, title, subtitle, body,
    // and footer; a single wider media band (60rem) carries the cover.
    expect(html).toContain("max-w-[43rem]");
    expect(html).toContain("max-w-[60rem]");
    expect(html).toContain("space-y-[clamp(2.5rem,4vw,4rem)]");
    expect(html).toContain("aspect-[16/9]");
    // No leftover marginalia grid/rail or the old grab-bag of widths.
    expect(html).not.toContain("marginalia:");
    expect(html).not.toContain("max-w-[92rem]");
    expect(html).not.toContain("max-w-[76rem]");
    expect(html).not.toContain("max-w-[64rem]");
    expect(html).not.toContain("max-w-[56rem]");
    expect(html).not.toContain("max-w-[48rem]");
    expect(html).not.toContain("max-w-[24ch]");
    expect(html).not.toContain("max-w-[62ch]");
    expect(html).not.toContain("max-w-[72ch]");
    expect(html).not.toContain("2xl:");
  });

  it("renders the title in the display face", () => {
    const html = renderToStaticMarkup(
      <PostDetailArticle
        title="A field report"
        content={{ type: "doc", content: [] }}
        headings={[]}
        reading={{ minutes: 4, words: 820 }}
        createdAt="2024-01-01T00:00:00.000Z"
        updatedAt="2024-01-01T00:00:00.000Z"
        publishedPrefix="Published"
      />
    );

    expect(html).toContain("font-display");
    expect(html).not.toContain("font-serif");
  });

  it("renders the date eyebrow and end-of-entry colophon with the All writing back link", () => {
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
        eyebrow="Jan 1, 2024"
      />
    );

    expect(html).toContain("Jan 1, 2024");
    expect(html).toContain("End of entry");
    expect(html).toContain("All writing");
    expect(html).not.toContain("Back to the ledger");
    expect(html).not.toContain("ledger");
    expect(html).not.toContain("journal-label");
  });

  it("renders the read-next footer block with the label, title link, and why when provided", () => {
    const html = renderToStaticMarkup(
      <PostDetailArticle
        title="A field report"
        content={{ type: "doc", content: [] }}
        headings={[]}
        reading={{ minutes: 4, words: 820 }}
        createdAt="2024-01-01T00:00:00.000Z"
        updatedAt="2024-01-01T00:00:00.000Z"
        publishedPrefix="Published"
        readNext={{
          label: "Read next",
          slug: "deeper-dive",
          title: "A deeper dive",
          why: "Builds directly on this report."
        }}
      />
    );

    expect(html).toContain("Read next");
    expect(html).toContain("A deeper dive");
    expect(html).toContain("Builds directly on this report.");
    expect(html).toContain("/posts/deeper-dive");
  });

  it("renders the Previous label without a why when that is the resolved read-next", () => {
    const html = renderToStaticMarkup(
      <PostDetailArticle
        title="A field report"
        content={{ type: "doc", content: [] }}
        headings={[]}
        reading={{ minutes: 4, words: 820 }}
        createdAt="2024-01-01T00:00:00.000Z"
        updatedAt="2024-01-01T00:00:00.000Z"
        publishedPrefix="Published"
        readNext={{
          label: "Previous",
          slug: "older-post",
          title: "An older post"
        }}
      />
    );

    expect(html).toContain("Previous");
    expect(html).toContain("An older post");
    expect(html).toContain("/posts/older-post");
    expect(html).not.toContain("Read next");
  });

  it("hides the read-next block when read-next is null", () => {
    const html = renderToStaticMarkup(
      <PostDetailArticle
        title="A field report"
        content={{ type: "doc", content: [] }}
        headings={[]}
        reading={{ minutes: 4, words: 820 }}
        createdAt="2024-01-01T00:00:00.000Z"
        updatedAt="2024-01-01T00:00:00.000Z"
        publishedPrefix="Published"
        readNext={null}
      />
    );

    expect(html).not.toContain("Read next");
    expect(html).not.toContain("Previous");
  });
});
