import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedPostBySlug, getPublishedPosts } from "@/lib/data/posts";
import { Badge } from "@/components/ui/badge";
import {
  formatDate,
  isSignificantlyUpdated,
  isAllowedImageHost,
  extractHeadings,
  readingTimeFromContent,
  plainTextFromContent
} from "@/lib/utils";
import RichTextViewer from "@/components/rich-text-viewer";
import TableOfContents from "@/components/table-of-contents";
import ReadingProgress from "@/components/reading-progress";

export const revalidate = 3600;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const posts = await getPublishedPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  if (!post) return {};

  const text = plainTextFromContent(post.content);
  const description =
    post.excerpt?.trim() || (text ? text.slice(0, 160) : "Read the latest post from Meet Tilavat.");
  const url = `https://meettilavat.com/posts/${slug}`;

  return {
    title: post.title,
    description,
    alternates: { canonical: `/posts/${slug}` },
    openGraph: {
      type: "article",
      url,
      title: post.title,
      description,
      images: post.cover_image_url ? [{ url: post.cover_image_url }] : undefined
    },
    twitter: {
      card: post.cover_image_url ? "summary_large_image" : "summary",
      title: post.title,
      description,
      images: post.cover_image_url ? [post.cover_image_url] : undefined
    }
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);

  if (!post) {
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
                sizes="(max-width: 1024px) 100vw, 1100px"
                className="h-full w-full object-cover"
                priority
                fetchPriority="high"
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
