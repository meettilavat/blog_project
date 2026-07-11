/* eslint-disable @next/next/no-img-element */
import Image from "next/image";
import { cn } from "@/lib/ui/classnames";
import { isAllowedImageHost } from "@/lib/content/image-host-policy";
import { getRuntimeImageHostPolicy } from "@/lib/content/runtime-image-host-policy";

type PostCoverMediaProps = {
  src?: string | null;
  alt: string;
  emptyLabel?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
  fetchPriority?: "high" | "low" | "auto";
  className?: string;
  fit?: "cover" | "contain";
  position?: "center" | "top";
};

export function PostCoverMedia({
  src,
  alt,
  emptyLabel = "No cover image",
  fill = false,
  width,
  height,
  sizes = "100vw",
  priority = false,
  fetchPriority,
  className,
  fit = "cover",
  position = "center"
}: PostCoverMediaProps) {
  const imageHostPolicy = getRuntimeImageHostPolicy();
  const mediaClassName = cn(
    "h-full w-full",
    fit === "contain" ? "object-contain" : "object-cover",
    position === "top" ? "object-top" : "object-center",
    className
  );

  if (!src) {
    return (
      <div
        className={cn(
          "relative h-full w-full overflow-hidden bg-muted",
          className
        )}
        data-cover-placeholder="true"
        role="img"
        aria-label={emptyLabel}
      >
        <span className="grid-ruled absolute inset-0 opacity-40" aria-hidden="true" />
        <span className="absolute bottom-3 left-3 font-mono text-[10px] uppercase tracking-[0.16em] text-foreground/70" aria-hidden="true">
          Image field pending
        </span>
        <span className="sr-only">{emptyLabel}</span>
      </div>
    );
  }

  if (isAllowedImageHost(src, imageHostPolicy)) {
    if (fill) {
      return (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          className={mediaClassName}
          priority={priority}
          fetchPriority={fetchPriority}
        />
      );
    }

    return (
      <Image
        src={src}
        alt={alt}
        width={width ?? 1600}
        height={height ?? 900}
        sizes={sizes}
        className={mediaClassName}
        priority={priority}
        fetchPriority={fetchPriority}
      />
    );
  }

  return fill ? (
    <img src={src} alt={alt} className={mediaClassName} />
  ) : (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={mediaClassName}
    />
  );
}

export default PostCoverMedia;
