import {
  headingIdFromParsedNode,
  textFromParsedNode
} from "@/lib/tiptap/normalize/content-normalization";
import { parsePositiveInteger } from "@/lib/tiptap/normalize/parse-number";
import type { SanitizedTiptapNode } from "@/lib/tiptap/model/tiptap-model";
import { isRenderableNode } from "./rich-text-node-guards";
import { wrapTextMarks } from "./rich-text-mark-renderer";
import { renderImageNode } from "./rich-text-image-renderer";
import { renderTableNode } from "./rich-text-table-renderer";
import type { NodeRenderer, RendererContext } from "./rich-text-node-types";

function renderHeadingNode(node: SanitizedTiptapNode, key: string, context: RendererContext) {
  const level = parsePositiveInteger(node.attrs?.level) ?? 2;
  const clamped = Math.min(6, Math.max(1, level));
  const id = headingIdFromParsedNode(node);
  const children = context.renderNodes(node.content, key);
  const tagByLevel = ["h1", "h2", "h3", "h4", "h5", "h6"] as const;
  const HeadingTag = tagByLevel[clamped - 1] ?? "h2";

  return (
    <HeadingTag key={key} id={id}>
      {children}
    </HeadingTag>
  );
}

const NODE_RENDERERS: Record<string, NodeRenderer> = {
  doc: (node, _key, context) => <>{context.renderNodes(node.content, "doc")}</>,
  paragraph: (node, key, context) => <p key={key}>{context.renderNodes(node.content, key)}</p>,
  heading: (node, key, context) => renderHeadingNode(node, key, context),
  text: (node, key) => {
    const value = typeof node.text === "string" ? node.text : "";
    return <span key={key}>{wrapTextMarks(value, node.marks, key)}</span>;
  },
  bulletList: (node, key, context) => <ul key={key}>{context.renderNodes(node.content, key)}</ul>,
  orderedList: (node, key, context) => {
    const start = parsePositiveInteger(node.attrs?.start);
    return (
      <ol key={key} start={start ?? undefined}>
        {context.renderNodes(node.content, key)}
      </ol>
    );
  },
  listItem: (node, key, context) => <li key={key}>{context.renderNodes(node.content, key)}</li>,
  blockquote: (node, key, context) => <blockquote key={key}>{context.renderNodes(node.content, key)}</blockquote>,
  hardBreak: (_node, key) => <br key={key} />,
  horizontalRule: (_node, key) => <hr key={key} />,
  codeBlock: (node, key) => {
    const code = textFromParsedNode(node);
    return (
      <pre key={key}>
        <code>{code}</code>
      </pre>
    );
  },
  table: (node, key, context) => renderTableNode(node, key, context),
  image: (node, key, context) => renderImageNode(node, key, context.imageHostPolicy)
};

export { isRenderableNode };

export function renderRichTextNode(
  node: SanitizedTiptapNode,
  key: string,
  context: RendererContext
): React.ReactNode {
  const renderer = typeof node.type === "string" ? NODE_RENDERERS[node.type] : undefined;
  if (!renderer) {
    return <div key={key}>{context.renderNodes(node.content, key)}</div>;
  }
  return renderer(node, key, context);
}
