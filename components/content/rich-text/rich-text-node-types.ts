import type { SanitizedTiptapNode } from "@/lib/tiptap/model/tiptap-model";
import type { ImageHostPolicy } from "@/lib/content/image-host-policy";

export type RendererContext = {
  renderNodes: (nodes: SanitizedTiptapNode[] | undefined, keyPrefix: string) => React.ReactNode;
  renderNode: (node: SanitizedTiptapNode, key: string) => React.ReactNode;
  imageHostPolicy: ImageHostPolicy;
};

export type NodeRenderer = (
  node: SanitizedTiptapNode,
  key: string,
  context: RendererContext
) => React.ReactNode;

export type RichTextMark = NonNullable<SanitizedTiptapNode["marks"]>[number];
