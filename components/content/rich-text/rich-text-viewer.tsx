import type { PostContent } from "@/lib/posts/contracts/domain/types";
import { toRichContentValue } from "@/lib/posts/contracts/domain/content-adapter";
import { getRuntimeImageHostPolicy } from "@/lib/content/runtime-image-host-policy";
import { analyzeContent } from "@/lib/tiptap/content-pipeline";
import type { SanitizedTiptapNode } from "@/lib/tiptap/model/tiptap-model";
import { cn } from "@/lib/ui/classnames";
import {
  isRenderableNode,
  renderRichTextNode
} from "./rich-text-node-renderers";

type Props = {
  content: PostContent;
  className?: string;
};

const EMPTY_DOC: SanitizedTiptapNode = {
  type: "doc",
  content: [{ type: "paragraph", content: [{ type: "text", text: "" }] }]
} as SanitizedTiptapNode;

export function RichTextViewer({ content, className }: Props) {
  const contentPipeline = analyzeContent(toRichContentValue(content) ?? EMPTY_DOC);
  const safeContent = contentPipeline.content;
  const imageHostPolicy = getRuntimeImageHostPolicy();

  const renderNodes = (nodes: SanitizedTiptapNode[] | undefined, keyPrefix: string) => {
    if (!Array.isArray(nodes) || nodes.length === 0) return null;
    return nodes
      .filter(isRenderableNode)
      .map((node, index) => renderNode(node, `${keyPrefix}-${index}`));
  };

  const renderNode = (node: SanitizedTiptapNode, key: string): React.ReactNode =>
    renderRichTextNode(node, key, {
      renderNodes,
      renderNode,
      imageHostPolicy
    });

  if (!safeContent) return null;

  return (
    <div
      className={cn(
        "tiptap break-words text-[1.03rem] leading-[1.84] text-foreground/95",
        className ?? "mx-auto max-w-[80ch]"
      )}
    >
      {renderNode(safeContent, "doc")}
    </div>
  );
}

export default RichTextViewer;
