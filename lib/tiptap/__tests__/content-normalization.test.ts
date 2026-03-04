import { describe, expect, it } from "vitest";
import {
  headingIdFromNode,
  headingIdFromParsedNode,
  normalizeTiptapContent,
  textFromParsedNode,
  textFromTiptapNode
} from "../normalize/content-normalization";
import { parsePositiveInteger } from "../normalize/parse-number";

describe("lib/tiptap/normalize/content-normalization.ts", () => {
  it("normalizes unknown input into parsed tiptap documents", () => {
    expect(normalizeTiptapContent(null)).toBeNull();

    const normalized = normalizeTiptapContent({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Hello" }, { type: "text", text: " world" }]
        },
        {
          type: "unknown",
          marks: [{ type: "bold" }, { bad: true }]
        }
      ]
    });

    expect(normalized?.type).toBe("doc");
    expect(Array.isArray(normalized?.content)).toBe(true);
    expect(normalized?.content?.[1]?.marks).toEqual([{ type: "bold", attrs: undefined }]);
  });

  it("fails closed for cyclic/non-serializable payloads", () => {
    const cyclicNode: Record<string, unknown> = {
      type: "doc",
      content: []
    };
    (cyclicNode.content as unknown[]).push(cyclicNode);

    expect(normalizeTiptapContent(cyclicNode)).toBeNull();
    expect(textFromTiptapNode(cyclicNode)).toBe("");
    expect(headingIdFromNode(cyclicNode)).toBe("");
  });

  it("parses positive integer variants safely", () => {
    expect(parsePositiveInteger(3)).toBe(3);
    expect(parsePositiveInteger("7")).toBe(7);
    expect(parsePositiveInteger(" 9 ")).toBe(9);
    expect(parsePositiveInteger("0")).toBeNull();
    expect(parsePositiveInteger("abc")).toBeNull();
  });

  it("derives text and heading ids from parsed and unknown nodes", () => {
    const parsedHeading = {
      type: "heading",
      content: [{ type: "text", text: "Section Title" }]
    };

    expect(textFromParsedNode(parsedHeading)).toBe("Section Title");
    expect(textFromTiptapNode(parsedHeading)).toBe("Section Title");
    expect(headingIdFromParsedNode(parsedHeading)).toBe("section-title");
    expect(headingIdFromNode(parsedHeading)).toBe("section-title");
    expect(
      headingIdFromNode({
        type: "heading",
        attrs: { id: "custom-id" },
        content: [{ type: "text", text: "Ignored" }]
      })
    ).toBe("custom-id");
  });
});
