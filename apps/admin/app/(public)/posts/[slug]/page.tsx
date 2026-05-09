export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostBySlug } from "@/lib/posts/repository/admin-posts-repository";
import {
  analyzeContent
} from "@/lib/tiptap/content-pipeline";
import { ReadingProgress } from "@/components/content/chrome/reading-progress";
import PostDetailArticle from "@/components/posts/post-detail-article";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const postResult = await getPostBySlug(slug);

  if (!postResult.ok) {
    throw new Error(postResult.error.message);
  }

  if (!postResult.data) {
    notFound();
  }
  const post = postResult.data;
  const isDraft = post.status !== "published";

  const contentPipeline = analyzeContent(post.content);
  const draftBanner = isDraft ? (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-dashed border-foreground/30 bg-card/70 px-4 py-3 text-xs uppercase tracking-[0.2em] text-foreground/70">
      <span>Draft preview &middot; not visible to readers</span>
      <Link
        href={`/editor/${post.slug}`}
        className="rounded-full border border-border/70 bg-background px-3 py-1 font-medium tracking-[0.2em] text-foreground hover:border-foreground/60"
      >
        Edit
      </Link>
    </div>
  ) : null;

  return (
    <>
      <ReadingProgress />
      <PostDetailArticle
        title={post.title}
        excerpt={post.excerpt}
        coverImageUrl={post.coverImageUrl}
        content={contentPipeline.content}
        headings={contentPipeline.headings}
        reading={contentPipeline.reading}
        createdAt={post.createdAt}
        updatedAt={post.updatedAt}
        publishedPrefix={isDraft ? "Drafted" : "Published"}
        draftBanner={draftBanner}
      />
    </>
  );
}
