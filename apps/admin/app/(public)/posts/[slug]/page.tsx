export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getPostBySlug } from "@/lib/posts/repository/admin-posts-repository";
import {
  analyzeContent
} from "@/lib/tiptap/content-pipeline";
import RichTextViewer from "@/components/content/rich-text/rich-text-viewer";
import TableOfContents from "@/components/content/chrome/table-of-contents";
import { ReadingProgress } from "@/components/content/chrome/reading-progress";
import PostCoverMedia from "@/components/posts/post-cover-media";
import PostMetaRow from "@/components/posts/post-meta-row";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const postResult = await getPostBySlug(slug);

  if (!postResult.ok) {
    throw new Error(postResult.error.message);
  }

  if (!postResult.data || postResult.data.status !== "published") {
    notFound();
  }
  const post = postResult.data;

  const contentPipeline = analyzeContent(post.content);
  const headings = contentPipeline.headings;
  const reading = contentPipeline.reading;

  return (
    <>
      <ReadingProgress offset={68} />
      <article className="space-y-10">
        <div className="relative aspect-[16/7] w-full overflow-hidden rounded-[32px] border border-border/80 bg-muted">
          <PostCoverMedia
            src={post.coverImageUrl}
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
              createdAt={post.createdAt}
              updatedAt={post.updatedAt}
              publishedPrefix="Published"
              readStats={reading}
              className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-foreground/60"
            />
            <h1 className="font-serif text-4xl leading-tight tracking-tight text-foreground sm:text-5xl">
              {post.title}
            </h1>
          </div>

          <TableOfContents headings={headings} />

          <RichTextViewer content={contentPipeline.content} />
        </div>
      </article>
    </>
  );
}
