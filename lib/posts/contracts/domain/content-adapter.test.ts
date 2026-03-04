import { describe, expect, it } from "vitest";
import {
  parsePostContent,
  toPostContent,
  toRichContentValue
} from "./content-adapter";

describe("lib/posts/contracts/domain/content-adapter.ts", () => {
  it("maps rich-content values into post-domain content", () => {
    const value = {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "Hello" }] }]
    };

    expect(toPostContent(value)).toEqual(value);
    expect(toRichContentValue(value)).toEqual(value);
  });

  it("parses null and object values as valid post content", () => {
    expect(parsePostContent(null)).toBeNull();
    expect(parsePostContent({ type: "doc", content: [] })).toEqual({
      type: "doc",
      content: []
    });
  });

  it("rejects non-object post content payloads", () => {
    expect(() => parsePostContent("not-json")).toThrow("content must be a JSON object or null");
    expect(() => parsePostContent(["array"])).toThrow("content must be a JSON object or null");
  });
});
