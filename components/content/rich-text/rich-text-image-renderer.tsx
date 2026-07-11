import Image from "next/image";
import type { CSSProperties } from "react";
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
  if (!imageProps) return null;

  const isPortrait = imageProps.height > imageProps.width;
  const isSideFigure = imageProps.layout === "side";
  const isWideFigure = imageProps.layout === "wide";
  const naturalWidth = isSideFigure
    ? Math.min(imageProps.width, 260)
    : isPortrait && !isWideFigure
      ? Math.min(imageProps.width, 320)
      : isWideFigure
        ? Math.min(imageProps.width, 1060)
        : imageProps.width;
  const sizes = isSideFigure
    ? "(max-width: 768px) 70vw, 260px"
    : isPortrait && !isWideFigure
      ? "(max-width: 768px) 70vw, 320px"
      : isWideFigure
        ? "(max-width: 768px) calc(100vw - 2.5rem), (max-width: 1199px) calc(100vw - 5rem), 1060px"
        : "(max-width: 768px) calc(100vw - 2.5rem), 720px";
  const figureStyle: CSSProperties = isSideFigure
    ? { maxWidth: `${naturalWidth}px` }
    : isWideFigure
      ? ({ "--figure-natural-width": `${naturalWidth}px` } as CSSProperties)
      : {
          maxWidth: `${naturalWidth}px`,
          marginLeft: "auto",
          marginRight: "auto",
          width: "100%"
        };

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
      data-source-width={imageProps.width}
      style={figureStyle}
    >
      <Image
        src={imageProps.src}
        alt={imageProps.alt}
        width={imageProps.width}
        height={imageProps.height}
        sizes={sizes}
        className="h-auto w-full"
        unoptimized={imageProps.unoptimized}
      />
      {imageProps.caption ? <figcaption>{imageProps.caption}</figcaption> : null}
    </figure>
  );
}
