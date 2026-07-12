import PostCoverMedia from "@/components/posts/post-cover-media";

type FigurePlateProps = {
  figureLabel: string;
  caption?: string;
  src: string | null;
  alt: string;
  sizes: string;
  priority?: boolean;
};

export function FigurePlate({ figureLabel, caption, src, alt, sizes, priority = false }: FigurePlateProps) {
  return (
    <figure className="relative flex flex-col border border-border bg-card p-[clamp(0.4rem,0.8vw,0.7rem)]">
      <span className="mb-2 font-mono text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-accent">
        {figureLabel}
      </span>
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
        <PostCoverMedia
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          className="object-cover object-center"
          priority={priority}
          fetchPriority={priority ? "high" : undefined}
          emptyLabel="Cover pending"
        />
      </div>
      {caption ? (
        <figcaption className="mt-2.5 border-t border-border/70 pt-2 text-[0.82rem] leading-[1.55] text-foreground/70">
          {caption}
        </figcaption>
      ) : null}
      {(["tl", "tr", "bl", "br"] as const).map((corner) => (
        <span key={corner} className="tiptap-figure-tick" data-corner={corner} aria-hidden="true" />
      ))}
    </figure>
  );
}

export default FigurePlate;
