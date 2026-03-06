import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getPublishedPostBySlug,
  getPublishedPosts
} from "@/lib/posts/repository/public-posts-repository";
import {
  analyzeContent
} from "@/lib/tiptap/content-pipeline";
import { getConfiguredSiteUrl } from "@/lib/site-url";
import { cn } from "@/lib/ui/classnames";
import RichTextViewer from "@/components/content/rich-text/rich-text-viewer";
import TableOfContents from "@/components/content/chrome/table-of-contents";
import { ReadingProgress } from "@/components/content/chrome/reading-progress";
import PostCoverMedia from "@/components/posts/post-cover-media";
import PostMetaRow from "@/components/posts/post-meta-row";
import { FadeIn } from "@/components/motion/fade-in";
import StructuredDataScript from "@/components/seo/structured-data-script";
import {
  POST_DESCRIPTION_FALLBACK,
  buildPublicAssetUrl,
  buildBlogPostingStructuredData
} from "@/lib/seo/public-site";

type Props = {
  params: Promise<{ slug: string }>;
};

function buildPostDescription({
  excerpt,
  plainText
}: {
  excerpt?: string | null;
  plainText: string;
}) {
  return excerpt?.trim() || (plainText ? plainText.slice(0, 160) : POST_DESCRIPTION_FALLBACK);
}

export async function generateStaticParams() {
  const postsResult = await getPublishedPosts();
  const posts = postsResult.ok ? postsResult.data : [];
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const postResult = await getPublishedPostBySlug(slug);
  if (!postResult.ok || !postResult.data) {
    return {};
  }
  const post = postResult.data;

  const contentPipeline = analyzeContent(post.content);
  const description = buildPostDescription({
    excerpt: post.excerpt,
    plainText: contentPipeline.plainText
  });
  const configuredSiteUrl = getConfiguredSiteUrl();
  const url = configuredSiteUrl ? `${configuredSiteUrl}/posts/${slug}` : `/posts/${slug}`;
  const imageUrl =
    configuredSiteUrl && post.coverImageUrl
      ? buildPublicAssetUrl(post.coverImageUrl, configuredSiteUrl)
      : post.coverImageUrl;

  return {
    title: post.title,
    description,
    alternates: { canonical: `/posts/${slug}` },
    openGraph: {
      type: "article",
      url,
      title: post.title,
      description,
      images: imageUrl ? [{ url: imageUrl }] : undefined
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title: post.title,
      description,
      images: imageUrl ? [imageUrl] : undefined
    }
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const postResult = await getPublishedPostBySlug(slug);

  if (!postResult.ok) {
    throw new Error(postResult.error.message);
  }

  if (!postResult.data) {
    notFound();
  }
  const post = postResult.data;

  const contentPipeline = analyzeContent(post.content);
  const configuredSiteUrl = getConfiguredSiteUrl();
  const description = buildPostDescription({
    excerpt: post.excerpt,
    plainText: contentPipeline.plainText
  });
  const headings = contentPipeline.headings;
  const hasHeadings = headings.length > 0;
  const reading = contentPipeline.reading;
  const centeredReadingClass = "mx-auto w-full max-w-[62rem]";

  return (
    <>
      {configuredSiteUrl ? (
        <StructuredDataScript
          data={buildBlogPostingStructuredData({
            siteUrl: configuredSiteUrl,
            slug,
            title: post.title,
            description,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
            coverImageUrl: post.coverImageUrl
          })}
        />
      ) : null}
      <ReadingProgress />
      <article className="space-y-8">
        <FadeIn y={12} duration={0.4}>
          <div className={cn(!hasHeadings && centeredReadingClass)}>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-foreground/80 transition-[transform,border-color,background-color,color] duration-200 hover:-translate-y-[1px] hover:border-foreground/40 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground motion-reduce:transform-none motion-reduce:transition-none"
            >
              <span aria-hidden="true">←</span>
              Back to Posts
            </Link>
          </div>
        </FadeIn>

        <FadeIn y={16} duration={0.5} delay={0.05}>
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[32px] border border-border/80 bg-muted">
            <PostCoverMedia
              src={post.coverImageUrl}
              alt={post.title}
              fill
              sizes="(max-width: 1024px) 100vw, 1100px"
              className="h-full w-full object-cover"
              priority
              fetchPriority="high"
              emptyLabel="No cover image"
            />
          </div>
        </FadeIn>

        <FadeIn y={20} duration={0.55} delay={0.12}>
          <div className={cn("space-y-6", !hasHeadings && centeredReadingClass)}>
            <div className="space-y-5">
              <PostMetaRow
                createdAt={post.createdAt}
                updatedAt={post.updatedAt}
                publishedPrefix="Published"
                readStats={reading}
                className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-foreground/55 [font-variant-numeric:tabular-nums]"
              />
              <h1 className="font-serif text-[2.45rem] leading-[1.06] tracking-tight text-foreground sm:text-[3.45rem] lg:text-[3.85rem]">
                {post.title}
              </h1>
            </div>
            <hr className="border-border/40" />
          </div>
        </FadeIn>

        <div
          className={cn(
            "grid gap-10",
            hasHeadings ? "lg:grid-cols-[minmax(0,1fr)_260px] lg:items-start" : "lg:grid-cols-1"
          )}
        >
          <div className={cn("min-w-0", hasHeadings ? "max-w-[46rem]" : centeredReadingClass)}>
            <RichTextViewer content={contentPipeline.content} className="mx-0 max-w-none" />
          </div>
          {hasHeadings && <TableOfContents headings={headings} offsetTop={112} trackActive />}
        </div>
      </article>
    </>
  );
}
