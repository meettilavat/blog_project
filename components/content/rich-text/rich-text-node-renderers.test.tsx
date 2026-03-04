import type { JSONContent } from "@tiptap/core";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { isRenderableNode, renderRichTextNode } from "./rich-text-node-renderers";
import type { ImageHostPolicy } from "@/lib/content/image-host-policy";

const HTTPS_PROTOCOL = "https://";
const ALLOWED_IMAGE_URL = [HTTPS_PROTOCOL, "allowed.example", "/cover.png"].join("");

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    width,
    height,
    unoptimized
  }: {
    src: string;
    alt: string;
    width: number;
    height: number;
    unoptimized?: boolean;
  }) => (
    <img
      data-next-image
      src={src}
      alt={alt}
      width={String(width)}
      height={String(height)}
      data-unoptimized={String(Boolean(unoptimized))}
    />
  )
}));

vi.mock("@/lib/content/image-host-policy", () => ({
  isAllowedImageSource: (url: string) => {
    if (url.startsWith("/")) {
      return true;
    }
    if (url.startsWith("data:image/svg")) {
      return false;
    }
    if (url.startsWith("data:image/")) {
      return true;
    }
    return url.includes("allowed.example");
  },
  isAllowedImageHost: (url: string) => url.includes("allowed.example")
}));

type RendererContext = {
  renderNodes: (nodes: JSONContent[] | undefined, keyPrefix: string) => React.ReactNode;
  renderNode: (node: JSONContent, key: string) => React.ReactNode;
  imageHostPolicy: ImageHostPolicy;
};

const IMAGE_HOST_POLICY: ImageHostPolicy = {
  allowedImageHosts: new Set(["allowed.example"])
};

function createRendererContext(): RendererContext {
  const context: RendererContext = {
    imageHostPolicy: IMAGE_HOST_POLICY,
    renderNodes: (nodes, keyPrefix) =>
      Array.isArray(nodes)
        ? nodes
            .filter(isRenderableNode)
            .map((entry, index) => context.renderNode(entry, `${keyPrefix}-${index}`))
        : null,
    renderNode: (node, key) => renderRichTextNode(node, key, context)
  };
  return context;
}

function renderNode(node: JSONContent) {
  const context = createRendererContext();
  return renderToStaticMarkup(<>{context.renderNode(node, "node")}</>);
}

describe("components/content/rich-text-node-renderers.tsx", () => {
  it("identifies renderable tiptap nodes", () => {
    expect(isRenderableNode({ type: "paragraph" })).toBe(true);
    expect(isRenderableNode({})).toBe(false);
    expect(isRenderableNode(null)).toBe(false);
    expect(isRenderableNode("paragraph")).toBe(false);
  });

  it("renders text marks with nested wrappers", () => {
    const html = renderNode({
      type: "text",
      text: "Hello world",
      marks: [{ type: "bold" }, { type: "link", attrs: { href: "/docs" } }, { type: "noop" }]
    });

    expect(html).toContain("<span>");
    expect(html).toContain("<strong>Hello world</strong>");
    expect(html).toContain("href=\"/docs\"");
  });

  it("renders heading, table, and code block nodes", () => {
    const html = renderNode({
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 9 },
          content: [{ type: "text", text: "Hello World" }]
        },
        {
          type: "table",
          content: [
            {
              type: "tableRow",
              content: [
                {
                  type: "tableHeader",
                  content: [{ type: "text", text: "Topic" }]
                }
              ]
            },
            {
              type: "tableRow",
              content: [
                {
                  type: "tableCell",
                  content: [{ type: "text", text: "Body cell" }]
                }
              ]
            }
          ]
        },
        {
          type: "codeBlock",
          content: [{ type: "text", text: "const answer = 42;" }]
        }
      ]
    });

    expect(html).toContain("<h6 id=\"hello-world\">");
    expect(html).toContain("<table>");
    expect(html).toContain("<thead>");
    expect(html).toContain("<tbody>");
    expect(html).toContain("<code>const answer = 42;</code>");
  });

  it("renders image nodes with optimization and fallback behavior", () => {
    const optimizedImageHtml = renderNode({
      type: "image",
      attrs: {
        src: ALLOWED_IMAGE_URL,
        caption: "Cover caption",
        width: "640",
        height: "360"
      }
    });

    const unoptimizedImageHtml = renderNode({
      type: "image",
      attrs: {
        src: "data:image/png;base64,abc123"
      }
    });

    expect(optimizedImageHtml).toContain(`src="${ALLOWED_IMAGE_URL}"`);
    expect(optimizedImageHtml).toContain("alt=\"Cover caption\"");
    expect(optimizedImageHtml).toContain("data-unoptimized=\"false\"");
    expect(optimizedImageHtml).toContain("<figcaption>Cover caption</figcaption>");
    expect(unoptimizedImageHtml).toContain("alt=\"Embedded image\"");
    expect(unoptimizedImageHtml).toContain("data-unoptimized=\"true\"");
    expect(unoptimizedImageHtml).toContain("width=\"1200\"");
    expect(unoptimizedImageHtml).toContain("height=\"800\"");
  });

  it("falls back to a div renderer for unknown node types", () => {
    const html = renderNode({
      type: "unknown-node",
      content: [{ type: "text", text: "Fallback content" }]
    });

    expect(html).toContain("<div>");
    expect(html).toContain("Fallback content");
  });
});
