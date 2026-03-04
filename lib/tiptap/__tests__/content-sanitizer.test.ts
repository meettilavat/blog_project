import { describe, expect, it } from "vitest";
import { buildHttpsUrl } from "@/lib/config/http-url";
import { sanitizeParsedTiptapContent } from "../normalize/content-sanitizer";
import type { ImageHostPolicy } from "@/lib/content/image-host-policy";

const TEST_IMAGE_HOST_POLICY: ImageHostPolicy = {
  allowedImageHosts: new Set(["example.com"])
};

describe("lib/tiptap/normalize/content-sanitizer.ts", () => {
  it("drops unsafe image sources and unsafe links", () => {
    const sanitized = sanitizeParsedTiptapContent(
      {
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
                  { type: "link", attrs: { href: "javascript:alert(1)" } },
                  { type: "link", attrs: { href: buildHttpsUrl("example.com", "/docs") } }
                ]
              }
            ]
          },
          {
            type: "link",
            attrs: { href: "javascript:alert(1)" },
            content: [{ type: "text", text: "Unsafe" }]
          }
        ]
      },
      TEST_IMAGE_HOST_POLICY
    );

    expect(sanitized).toEqual({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Safe",
              marks: [{ type: "link", attrs: { href: buildHttpsUrl("example.com", "/docs") } }]
            }
          ]
        },
        {
          type: "link",
          attrs: {},
          content: [{ type: "text", text: "Unsafe" }]
        }
      ]
    });
  });
});
