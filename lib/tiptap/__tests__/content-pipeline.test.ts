import { describe, expect, it } from "vitest";
import { buildHttpsUrl } from "@/lib/config/http-url";
import type { TiptapContentValue, TiptapNode } from "@/lib/tiptap/model/tiptap-model";
import { analyzeContent } from "../content-pipeline";
import {
  headingIdFromParsedNode,
  headingIdFromNode,
  textFromParsedNode,
  textFromTiptapNode
} from "../normalize/content-normalization";
import { parsePositiveInteger } from "../normalize/parse-number";

const HTTPS_PROTOCOL = "https:";
const EXAMPLE_ORIGIN = `${HTTPS_PROTOCOL}//example.com`;
const SAFE_LINK_HREF = new URL("/", `${EXAMPLE_ORIGIN}/`).toString().replace(/\/$/, "");

describe("lib/tiptap/content-pipeline.ts", () => {
  it("extracts text recursively from tiptap nodes", () => {
    const node = {
      type: "paragraph",
      content: [
        { type: "text", text: "Hello" },
        {
          type: "text",
          text: "  world"
        }
      ]
    };

    expect(textFromTiptapNode(node)).toBe("Hello world");
  });

  it("extracts text from pre-parsed tiptap nodes without reparsing", () => {
    const parsedNode: TiptapNode = {
      type: "paragraph",
      content: [
        { type: "text", text: "Already" },
        { type: "text", text: " parsed" }
      ]
    };

    expect(textFromParsedNode(parsedNode)).toBe("Already parsed");
  });

  it("uses explicit heading id when present and falls back to slugified text", () => {
    expect(
      headingIdFromNode({
        type: "heading",
        attrs: { id: "custom-id" },
        content: [{ type: "text", text: "Ignored" }]
      })
    ).toBe("custom-id");

    expect(
      headingIdFromNode({
        type: "heading",
        content: [{ type: "text", text: "Section Title" }]
      })
    ).toBe("section-title");

    expect(
      headingIdFromParsedNode({
        type: "heading",
        content: [{ type: "text", text: "Parsed heading" }]
      })
    ).toBe("parsed-heading");
  });

  it("extracts heading list with parsed levels", () => {
    const content: TiptapContentValue = {
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: "2" },
          content: [{ type: "text", text: "Intro" }]
        },
        {
          type: "heading",
          attrs: { level: 3 },
          content: [{ type: "text", text: "Details" }]
        },
        {
          type: "heading",
          attrs: { level: 0 },
          content: [{ type: "text", text: "Ignored" }]
        }
      ]
    };

    expect(analyzeContent(content).headings).toEqual([
      { id: "intro", text: "Intro", level: 2 },
      { id: "details", text: "Details", level: 3 }
    ]);
  });

  it("computes plain-text and reading-time metrics", () => {
    const content: TiptapContentValue = {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "One two three" }] },
        { type: "paragraph", content: [{ type: "text", text: "four five" }] }
      ]
    };

    const analysis = analyzeContent(content);
    expect(analysis.plainText).toBe("One two three four five");
    expect(analysis.reading).toEqual({
      minutes: 1,
      words: 5
    });
  });

  it("builds a shared content analysis object with sanitized render model and metadata", () => {
    const content: TiptapContentValue = {
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Intro" }]
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "One two three" }]
        },
        {
          type: "image",
          attrs: { src: "javascript:alert(1)" }
        }
      ]
    };

    expect(analyzeContent(content)).toEqual({
      content: {
        type: "doc",
        content: [
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Intro" }]
          },
          {
            type: "paragraph",
            content: [{ type: "text", text: "One two three" }]
          }
        ]
      },
      headings: [{ id: "intro", text: "Intro", level: 2 }],
      plainText: "Intro One two three",
      reading: {
        minutes: 1,
        words: 4
      }
    });
  });

  it("parses positive integers from numbers and strings", () => {
    expect(parsePositiveInteger(3)).toBe(3);
    expect(parsePositiveInteger("7")).toBe(7);
    expect(parsePositiveInteger(" 9 ")).toBe(9);
    expect(parsePositiveInteger("0")).toBeNull();
    expect(parsePositiveInteger("7abc")).toBeNull();
    expect(parsePositiveInteger("not-a-number")).toBeNull();
  });

  it("sanitizes unsafe image sources and unsafe link marks", () => {
    const content: TiptapContentValue = {
      type: "doc",
      content: [
        {
          type: "image",
          attrs: { src: "javascript:alert(1)" }
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Safe",
              marks: [
                { type: "link", attrs: { href: SAFE_LINK_HREF } },
                { type: "link", attrs: { href: "javascript:alert(1)" } }
              ]
            }
          ]
        }
      ]
    };

    expect(analyzeContent(content).content).toEqual({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Safe",
              marks: [{ type: "link", attrs: { href: SAFE_LINK_HREF } }]
            }
          ]
        }
      ]
    });
  });

  it("reuses shared image host policy while sanitizing content", () => {
    const content: TiptapContentValue = {
      type: "doc",
      content: [
        {
          type: "image",
          attrs: { src: buildHttpsUrl("unknown.example.com", "/blocked.png") }
        },
        {
          type: "image",
          attrs: { src: buildHttpsUrl("images.unsplash.com", "/allowed.png") }
        }
      ]
    };

    expect(analyzeContent(content).content).toEqual({
      type: "doc",
      content: [
        {
          type: "image",
          attrs: { src: buildHttpsUrl("images.unsplash.com", "/allowed.png") }
        }
      ]
    });
  });
});
