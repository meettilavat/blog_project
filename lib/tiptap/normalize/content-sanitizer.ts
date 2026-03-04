import type { ImageHostPolicy } from "@/lib/content/image-host-policy";
import { isAllowedImageSource } from "@/lib/content/image-host-policy";
import { isAllowedLinkHref } from "@/lib/content/link-href-policy";
import type {
  SanitizedTiptapDocument,
  SanitizedTiptapNode,
  TiptapDocument,
  TiptapNode
} from "../model/tiptap-model";

export function sanitizeParsedTiptapContent(
  content: TiptapDocument,
  imageHostPolicy: ImageHostPolicy
): SanitizedTiptapDocument {
  const walk = (node: TiptapNode | null): SanitizedTiptapNode | null => {
    if (!node) return null;

    if ((node.type === "image" || node.type === "img") && node.attrs?.src) {
      const src = String(node.attrs.src);
      if (!isAllowedImageSource(src, imageHostPolicy)) return null;
    }

    if (Array.isArray(node.marks)) {
      node.marks = node.marks.filter((mark) => {
        if (!mark || mark.type !== "link") return true;
        const href = mark.attrs?.href;
        return typeof href === "string" && isAllowedLinkHref(href);
      });
    }

    if (node.type === "link" && typeof node.attrs?.href === "string" && !isAllowedLinkHref(node.attrs.href)) {
      delete node.attrs.href;
    }

    if (Array.isArray(node.content)) {
      node.content = node.content
        .map((child) => walk(child))
        .filter((child): child is SanitizedTiptapNode => Boolean(child));
    }

    return node as SanitizedTiptapNode;
  };

  return walk(content);
}
