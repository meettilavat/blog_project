import type { JSONContent } from "@tiptap/core";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { ImageHostPolicy } from "@/lib/content/image-host-policy";
import { renderTableNode } from "./rich-text-table-renderer";
import type { RendererContext } from "./rich-text-node-types";

const IMAGE_HOST_POLICY: ImageHostPolicy = {
  allowedImageHosts: new Set(["allowed.example"])
};

function createRendererContext(): RendererContext {
  const context: RendererContext = {
    imageHostPolicy: IMAGE_HOST_POLICY,
    renderNodes: (nodes, keyPrefix) =>
      Array.isArray(nodes)
        ? nodes.map((node, index) => context.renderNode(node, `${keyPrefix}-${index}`))
        : null,
    renderNode: (node, key) => {
      if (node.type === "text") {
        return <span key={key}>{node.text}</span>;
      }
      return <>{context.renderNodes(node.content as JSONContent[] | undefined, key)}</>;
    }
  };
  return context;
}

describe("components/content/rich-text-table-renderer.tsx", () => {
  it("renders a header row in thead and remaining rows in tbody", () => {
    const context = createRendererContext();
    const html = renderToStaticMarkup(
      <>
        {renderTableNode(
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
          "table-1",
          context
        )}
      </>
    );

    expect(html).toContain("<thead>");
    expect(html).toContain("<th><span>Topic</span></th>");
    expect(html).toContain("<tbody>");
    expect(html).toContain("<td><span>Body cell</span></td>");
  });
});
