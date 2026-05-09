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
  className
}: PostCoverMediaProps) {
  const imageHostPolicy = getRuntimeImageHostPolicy();

  if (!src) {
    return (
      <div
        className={cn(
          "h-full w-full bg-[radial-gradient(circle_at_20%_10%,rgb(184_92_56_/_0.24),transparent_38%),linear-gradient(135deg,rgb(237_228_214_/_0.95),rgb(216_199_173_/_0.86)_58%,rgb(184_92_56_/_0.2))]",
          className
        )}
        role="img"
        aria-label={emptyLabel}
      >
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
          className={cn("h-full w-full object-cover", className)}
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
        className={cn("h-full w-full object-cover", className)}
        priority={priority}
        fetchPriority={fetchPriority}
      />
    );
  }

  return fill ? (
    <img src={src} alt={alt} className={cn("h-full w-full object-cover", className)} />
  ) : (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={cn("h-full w-full object-cover", className)}
    />
  );
}

export default PostCoverMedia;
