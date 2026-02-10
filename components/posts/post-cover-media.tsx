/* eslint-disable @next/next/no-img-element */
import Image from "next/image";
import { cn, isAllowedImageHost } from "@/lib/utils";

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
  if (!src) {
    return (
      <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-[0.2em] text-foreground/50">
        {emptyLabel}
      </div>
    );
  }

  if (isAllowedImageHost(src)) {
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
