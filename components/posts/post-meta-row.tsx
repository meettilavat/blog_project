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
  const items = [createdLabel];

  if (isSignificantlyUpdated(createdAt, updatedAt)) {
    items.push(`Last updated ${formatDate(updatedAt)}`);
  }

  if (readStats) {
    items.push(`${readStats.minutes} min read`, `${readStats.words} words`);
  }

  return (
    <div className={cn(className)}>
      {items.map((item, index) => (
        <span key={item} className="inline-flex items-center gap-2">
          {index > 0 ? (
            <span className="text-foreground/35" aria-hidden="true">
              ·
            </span>
          ) : null}
          <span>{item}</span>
        </span>
      ))}
    </div>
  );
}

export default PostMetaRow;
