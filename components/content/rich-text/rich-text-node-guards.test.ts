import { describe, expect, it } from "vitest";
import { asParsedTiptapNode, isRenderableNode } from "./rich-text-node-guards";

describe("components/content/rich-text-node-guards.ts", () => {
  it("identifies renderable tiptap nodes", () => {
    expect(isRenderableNode({ type: "paragraph" })).toBe(true);
    expect(isRenderableNode({})).toBe(false);
    expect(isRenderableNode(null)).toBe(false);
    expect(isRenderableNode("paragraph")).toBe(false);
  });

  it("casts JSON content nodes into parsed tiptap nodes when type exists", () => {
    expect(
      asParsedTiptapNode({
        type: "paragraph",
        content: [{ type: "text", text: "Hello" }]
      })
    ).toMatchObject({
      type: "paragraph"
    });

    expect(asParsedTiptapNode({} as never)).toBeNull();
  });
});
