import { describe, expect, it } from "vitest";
import { deriveTiptapContentMetadata } from "../metadata/content-metadata";

describe("lib/tiptap/metadata/content-metadata.ts", () => {
  it("derives heading, plain text, and reading stats from parsed content", () => {
    const metadata = deriveTiptapContentMetadata({
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Intro" }]
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "One two three four five" }]
        },
        {
          type: "heading",
          attrs: { level: "3" },
          content: [{ type: "text", text: "Details" }]
        }
      ]
    });

    expect(metadata).toEqual({
      headings: [
        { id: "intro", text: "Intro", level: 2 },
        { id: "details", text: "Details", level: 3 }
      ],
      plainText: "Intro One two three four five Details",
      reading: {
        minutes: 1,
        words: 7
      }
    });
  });
});
