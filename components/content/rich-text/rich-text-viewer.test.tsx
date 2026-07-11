import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const analyzeContentMock = vi.fn();

vi.mock("@/lib/tiptap/content-pipeline", () => ({
  analyzeContent: (content: unknown) => analyzeContentMock(content)
}));

import { RichTextViewer } from "./rich-text-viewer";

describe("components/content/rich-text-viewer.tsx", () => {
  beforeEach(() => {
    analyzeContentMock.mockReset();
  });

  it("returns null when pipeline content is missing", () => {
    analyzeContentMock.mockReturnValue({
      content: null,
      headings: [],
      plainText: "",
      reading: { minutes: 1, words: 0 }
    });

    const html = renderToStaticMarkup(<RichTextViewer content={null} />);

    expect(analyzeContentMock).toHaveBeenCalledWith({
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "" }] }]
    });
    expect(html).toBe("");
  });

  it("renders parsed content with the default width class", () => {
    analyzeContentMock.mockReturnValue({
      content: {
        type: "doc",
        content: [{ type: "paragraph", content: [{ type: "text", text: "Rendered content" }] }]
      },
      headings: [],
      plainText: "Rendered content",
      reading: { minutes: 1, words: 2 }
    });

    const html = renderToStaticMarkup(
      <RichTextViewer content={{ type: "doc", content: [] }} />
    );

    expect(html).toContain("Rendered content");
    expect(html).toContain("mx-auto max-w-[80ch]");
  });

  it("uses a custom className when provided", () => {
    analyzeContentMock.mockReturnValue({
      content: {
        type: "doc",
        content: [{ type: "paragraph", content: [{ type: "text", text: "Custom class content" }] }]
      },
      headings: [],
      plainText: "Custom class content",
      reading: { minutes: 1, words: 3 }
    });

    const html = renderToStaticMarkup(
      <RichTextViewer content={{ type: "doc", content: [] }} className="custom-viewer-class" />
    );

    expect(html).toContain("Custom class content");
    expect(html).toContain("custom-viewer-class");
    expect(html).not.toContain("mx-auto max-w-[80ch]");
  });

  it("renders already-sanitized content without running the pipeline again", () => {
    const html = renderToStaticMarkup(
      <RichTextViewer
        content={{
          type: "doc",
          content: [{ type: "paragraph", content: [{ type: "text", text: "Sanitized" }] }]
        }}
        isSanitized
      />
    );

    expect(html).toContain("Sanitized");
    expect(analyzeContentMock).not.toHaveBeenCalled();
  });
});
