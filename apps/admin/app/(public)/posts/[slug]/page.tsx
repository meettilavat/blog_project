import Image from "next/image";
import { notFound } from "next/navigation";
import { getPostBySlug } from "@/lib/data/posts";
import { Badge } from "@/components/ui/badge";
import {
  formatDate,
  isSignificantlyUpdated,
  isAllowedImageHost,
  extractHeadings,
  readingTimeFromContent
} from "@/lib/utils";
import RichTextViewer from "@/components/rich-text-viewer";
import TableOfContents from "@/components/table-of-contents";
import ReadingProgress from "@/components/reading-progress";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post || post.status !== "published") {
    notFound();
  }

  const headings = extractHeadings(post.content);
  const reading = readingTimeFromContent(post.content);

  return (
    <>
      <ReadingProgress offset={68} />
      <article className="space-y-10">
        <div className="relative aspect-[16/7] w-full overflow-hidden rounded-[32px] border border-border/80 bg-muted">
          {post.cover_image_url ? (
            isAllowedImageHost(post.cover_image_url) ? (
              <Image
                src={post.cover_image_url}
                alt={post.title}
                width={1600}
                height={700}
                sizes="(max-width: 1024px) 100vw, 960px"
                className="h-full w-full object-cover"
                priority
              />
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={post.cover_image_url}
                alt={post.title}
                className="h-full w-full object-cover"
                width={1600}
                height={700}
              />
            )
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-[0.2em] text-foreground/50">
              No cover image
            </div>
          )}
        </div>

        <div className="space-y-10">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-foreground/60">
              <span>Published {formatDate(post.created_at)}</span>
              {isSignificantlyUpdated(post.created_at, post.updated_at) && (
                <Badge variant="outline">Last updated {formatDate(post.updated_at)}</Badge>
              )}
              <Badge variant="muted">{reading.minutes} min read · {reading.words} words</Badge>
            </div>
            <h1 className="font-serif text-4xl leading-tight tracking-tight text-foreground sm:text-5xl">
              {post.title}
            </h1>
          </div>

          <TableOfContents headings={headings} />

          <RichTextViewer content={post.content as any} />
        </div>
      </article>
    </>
  );
}
