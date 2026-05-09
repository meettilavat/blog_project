import Image from "next/image";
import type { SanitizedTiptapNode } from "@/lib/tiptap/model/tiptap-model";
import type { ImageHostPolicy } from "@/lib/content/image-host-policy";
import { resolveImageRenderProps } from "@/lib/content/rich-text/image-render-props";

export function renderImageNode(
  node: SanitizedTiptapNode,
  key: string,
  imageHostPolicy: ImageHostPolicy
) {
  const imageProps = resolveImageRenderProps(node, imageHostPolicy);
  if (!imageProps) {
    return null;
  }

  const isPortrait =
    typeof imageProps.width === "number" &&
    typeof imageProps.height === "number" &&
    imageProps.height > imageProps.width;

  return (
    <figure
      key={key}
      className="tiptap-figure"
      style={
        isPortrait
          ? { maxWidth: "320px", marginLeft: "auto", marginRight: "auto", width: "100%" }
          : undefined
      }
    >
      <Image
        src={imageProps.src}
        alt={imageProps.alt}
        width={imageProps.width}
        height={imageProps.height}
        sizes={isPortrait ? "(max-width: 768px) 70vw, 320px" : "(max-width: 768px) 92vw, 1060px"}
        className="h-auto w-full"
        unoptimized={imageProps.unoptimized}
      />
      {imageProps.caption ? <figcaption>{imageProps.caption}</figcaption> : null}
    </figure>
  );
}
