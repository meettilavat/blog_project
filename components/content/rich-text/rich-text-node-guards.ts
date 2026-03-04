import type { SanitizedTiptapNode, TiptapNode } from "@/lib/tiptap/model/tiptap-model";

export function isRenderableNode(value: unknown): value is SanitizedTiptapNode {
  return Boolean(value) && typeof value === "object" && typeof (value as SanitizedTiptapNode).type === "string";
}

export function asParsedTiptapNode(node: SanitizedTiptapNode): TiptapNode | null {
  if (typeof node.type !== "string") {
    return null;
  }
  return node as TiptapNode;
}
