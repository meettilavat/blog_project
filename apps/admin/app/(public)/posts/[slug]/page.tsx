import { notFound } from "next/navigation";
import { getPostBySlug } from "@/lib/data/posts";
import {
  extractHeadings,
  readingTimeFromContent
} from "@/lib/utils";
import RichTextViewer from "@/components/rich-text-viewer";
import TableOfContents from "@/components/table-of-contents";
import ReadingProgress from "@/components/reading-progress";
import PostCoverMedia from "@/components/posts/post-cover-media";
import PostMetaRow from "@/components/posts/post-meta-row";

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
          <PostCoverMedia
            src={post.cover_image_url}
            alt={post.title}
            width={1600}
            height={700}
            sizes="(max-width: 1024px) 100vw, 960px"
            className="h-full w-full object-cover"
            priority
            fetchPriority="high"
            emptyLabel="No cover image"
          />
        </div>

        <div className="space-y-10">
          <div className="space-y-3">
            <PostMetaRow
              createdAt={post.created_at}
              updatedAt={post.updated_at}
              publishedPrefix="Published"
              readStats={reading}
              className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-foreground/60"
            />
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
