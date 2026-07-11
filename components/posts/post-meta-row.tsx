import { formatDate, isSignificantlyUpdated } from "@/lib/typography/date";
import { cn } from "@/lib/ui/classnames";

type ReadStats = {
  minutes: number;
  words: number;
};

type PostMetaRowProps = {
  createdAt: string;
  updatedAt: string;
  className?: string;
  publishedPrefix?: string;
  readStats?: ReadStats;
};

export function PostMetaRow({
  createdAt,
  updatedAt,
  className,
  publishedPrefix,
  readStats
}: PostMetaRowProps) {
  const createdLabel = publishedPrefix
    ? `${publishedPrefix} ${formatDate(createdAt)}`
    : formatDate(createdAt);
  const publicationItems = [createdLabel];

  if (isSignificantlyUpdated(createdAt, updatedAt)) {
    publicationItems.push(`Last updated ${formatDate(updatedAt)}`);
  }

  return (
    <div className={cn(className)}>
      <span data-meta-group="publication" className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
        {publicationItems.map((item) => (
          <span key={item} className="whitespace-nowrap">{item}</span>
        ))}
      </span>
      {readStats ? (
        <span data-meta-group="reading" className="inline-flex whitespace-nowrap items-center gap-2">
          <span>{readStats.minutes} min read</span>
          <span className="text-accent/70" aria-hidden="true">/</span>
          <span>{readStats.words} words</span>
        </span>
      ) : null}
    </div>
  );
}

export default PostMetaRow;
