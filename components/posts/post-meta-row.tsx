import { Badge } from "@/components/ui/badge";
import { cn, formatDate, isSignificantlyUpdated } from "@/lib/utils";

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

  return (
    <div className={cn(className)}>
      <span>{createdLabel}</span>
      {isSignificantlyUpdated(createdAt, updatedAt) && (
        <Badge variant="outline">Last updated {formatDate(updatedAt)}</Badge>
      )}
      {readStats && (
        <Badge variant="muted">
          {readStats.minutes} min read · {readStats.words} words
        </Badge>
      )}
    </div>
  );
}

export default PostMetaRow;
