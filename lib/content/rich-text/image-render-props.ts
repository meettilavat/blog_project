import { parsePositiveInteger } from "@/lib/tiptap/normalize/parse-number";
import type { SanitizedTiptapNode } from "@/lib/tiptap/model/tiptap-model";
import type { ImageHostPolicy } from "@/lib/content/image-host-policy";
import { isAllowedImageHost, isAllowedImageSource } from "@/lib/content/image-host-policy";

const FALLBACK_IMAGE_WIDTH = 1200;
const FALLBACK_IMAGE_HEIGHT = 800;

type RichTextImageRenderProps = {
  src: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
  unoptimized: boolean;
  layout: "center" | "side" | "wide";
  align: "left" | "right";
};

function isRemoteHttpUrl(src: string) {
  return src.startsWith("http://") || src.startsWith("https://");
}

function isOptimizableImage(src: string, imageHostPolicy: ImageHostPolicy) {
  if (src.startsWith("/")) return true;
  if (!isRemoteHttpUrl(src)) return false;
  return isAllowedImageHost(src, imageHostPolicy);
}

export function resolveImageRenderProps(
  node: SanitizedTiptapNode,
  imageHostPolicy: ImageHostPolicy
): RichTextImageRenderProps | null {
  const src = typeof node.attrs?.src === "string" ? node.attrs.src : "";
  if (!src || !isAllowedImageSource(src, imageHostPolicy)) {
    return null;
  }

  const caption = typeof node.attrs?.caption === "string" ? node.attrs.caption.trim() : "";
  const alt = typeof node.attrs?.alt === "string" && node.attrs.alt ? node.attrs.alt : "";
  const layout = node.attrs?.layout === "side" || node.attrs?.layout === "wide" ? node.attrs.layout : "center";
  const align = node.attrs?.align === "left" ? "left" : "right";

  return {
    src,
    alt: alt || caption || "Embedded image",
    caption,
    width: parsePositiveInteger(node.attrs?.width) ?? FALLBACK_IMAGE_WIDTH,
    height: parsePositiveInteger(node.attrs?.height) ?? FALLBACK_IMAGE_HEIGHT,
    unoptimized: !isOptimizableImage(src, imageHostPolicy),
    layout,
    align
  };
}
