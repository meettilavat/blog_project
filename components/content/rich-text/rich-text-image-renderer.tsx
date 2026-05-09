import Image from "next/image";
import type { SanitizedTiptapNode } from "@/lib/tiptap/model/tiptap-model";
import type { ImageHostPolicy } from "@/lib/content/image-host-policy";
import { resolveImageRenderProps } from "@/lib/content/rich-text/image-render-props";
import { cn } from "@/lib/ui/classnames";

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
  const isSideFigure = imageProps.layout === "side";
  const isWideFigure = imageProps.layout === "wide";

  return (
    <figure
      key={key}
      className={cn(
        "tiptap-figure",
        isSideFigure && "tiptap-figure-side",
        isSideFigure && imageProps.align === "left" && "tiptap-figure-side-left",
        isSideFigure && imageProps.align === "right" && "tiptap-figure-side-right",
        isWideFigure && "tiptap-figure-wide"
      )}
      data-layout={imageProps.layout}
      data-align={isSideFigure ? imageProps.align : undefined}
      style={
        isPortrait && !isSideFigure && !isWideFigure
          ? { maxWidth: "320px", marginLeft: "auto", marginRight: "auto", width: "100%" }
          : undefined
      }
    >
      <Image
        src={imageProps.src}
        alt={imageProps.alt}
        width={imageProps.width}
        height={imageProps.height}
        sizes={
          isSideFigure
            ? "(max-width: 768px) 70vw, 260px"
            : isPortrait && !isWideFigure
              ? "(max-width: 768px) 70vw, 320px"
              : "(max-width: 768px) 92vw, 1060px"
        }
        className="h-auto w-full"
        unoptimized={imageProps.unoptimized}
      />
      {imageProps.caption ? <figcaption>{imageProps.caption}</figcaption> : null}
    </figure>
  );
}
