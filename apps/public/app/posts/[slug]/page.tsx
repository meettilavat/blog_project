import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getPublishedPostBySlug,
  getPublishedPosts
} from "@/lib/posts/repository/public-posts-repository";
import {
  analyzeContent
} from "@/lib/tiptap/content-pipeline";
import { resolveReadNext } from "@/lib/posts/read-next";
import { formatDate } from "@/lib/typography/date";
import { getConfiguredSiteUrl } from "@/lib/site-url";
import { ReadingProgress } from "@/components/content/chrome/reading-progress";
import PostDetailArticle from "@/components/posts/post-detail-article";
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

  const postsResult = await getPublishedPosts();
  const allPosts = postsResult.ok ? postsResult.data : [];
  const readNext = resolveReadNext(post.slug, allPosts);

  const contentPipeline = analyzeContent(post.content);
  const configuredSiteUrl = getConfiguredSiteUrl();
  const description = buildPostDescription({
    excerpt: post.excerpt,
    plainText: contentPipeline.plainText
  });

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
      <PostDetailArticle
        title={post.title}
        excerpt={post.excerpt}
        coverImageUrl={post.coverImageUrl}
        content={contentPipeline.content}
        headings={contentPipeline.headings}
        reading={contentPipeline.reading}
        createdAt={post.createdAt}
        updatedAt={post.updatedAt}
        publishedPrefix="Published"
        eyebrow={formatDate(post.createdAt)}
        readNext={readNext}
      />
    </>
  );
}
