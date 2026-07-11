import Link from "next/link";
import RichTextViewer from "@/components/content/rich-text/rich-text-viewer";
import TableOfContents from "@/components/content/chrome/table-of-contents";
import { FadeIn } from "@/components/motion/fade-in";
import PostCoverMedia from "@/components/posts/post-cover-media";
import PostMetaRow from "@/components/posts/post-meta-row";
import type { PostContent } from "@/lib/posts/contracts/domain/types";
import type { HeadingItem } from "@/lib/tiptap/metadata/content-metadata";
import { cn } from "@/lib/ui/classnames";

type ReadingStats = {
  minutes: number;
  words: number;
};

type PostDetailArticleProps = {
  title: string;
  excerpt?: string | null;
  coverImageUrl?: string | null;
  content: PostContent;
  headings: HeadingItem[];
  reading: ReadingStats;
  createdAt: string;
  updatedAt: string;
  publishedPrefix: string;
  draftBanner?: React.ReactNode;
};

const READING_WIDTH_CLASS = "mx-auto w-full max-w-[82ch]";
const HEADER_WIDTH_CLASS = "mx-auto w-full max-w-[48rem]";
const COVER_WIDTH_CLASS = "mx-auto w-full max-w-[68rem]";
const ARTICLE_SHELL_CLASS =
  "mx-auto w-full max-w-[82ch] 2xl:relative 2xl:left-1/2 2xl:grid 2xl:w-[calc(100vw-2.5rem)] 2xl:max-w-[calc(100vw-2.5rem)] 2xl:-translate-x-1/2 2xl:grid-cols-[minmax(0,1fr)_minmax(0,82ch)_minmax(0,1fr)]";

export function PostDetailArticle({
  title,
  excerpt,
  coverImageUrl,
  content,
  headings,
  reading,
  createdAt,
  updatedAt,
  publishedPrefix,
  draftBanner
}: PostDetailArticleProps) {
  const hasHeadings = headings.length > 0;
  const updatedAfterCreated =
    new Date(updatedAt).getTime() - new Date(createdAt).getTime() > 60 * 60 * 1000;

  return (
    <>
      {draftBanner ? <div className={cn("mb-6", READING_WIDTH_CLASS)}>{draftBanner}</div> : null}
      <article className="space-y-10 lg:space-y-12">
        <FadeIn y={12} duration={0.4}>
          <div className={HEADER_WIDTH_CLASS}>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-foreground/75 transition-[transform,border-color,background-color,color] duration-200 hover:-translate-y-px hover:border-foreground/50 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground motion-reduce:transform-none motion-reduce:transition-none"
            >
              <span aria-hidden="true">←</span>
              Back to posts
            </Link>
          </div>
        </FadeIn>

        <FadeIn y={20} duration={0.55} delay={0.05}>
          <header className={cn("space-y-6", HEADER_WIDTH_CLASS)}>
            <div className="space-y-5">
              <PostMetaRow
                createdAt={createdAt}
                updatedAt={updatedAt}
                publishedPrefix={publishedPrefix}
                readStats={reading}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] uppercase tracking-[0.24em] text-foreground/55 [font-variant-numeric:tabular-nums]"
              />
              <h1 className="max-w-[31ch] scroll-mt-28 font-serif text-[2.55rem] leading-[1.04] tracking-[-0.018em] text-foreground sm:text-[3.4rem] lg:text-[4rem]">
                {title}
              </h1>
              {excerpt ? (
                <p className="max-w-[68ch] text-lg leading-relaxed text-foreground/72 sm:text-xl">
                  {excerpt}
                </p>
              ) : null}
            </div>
            <hr className="border-border/50" />
          </header>
        </FadeIn>

        <FadeIn y={20} duration={0.55} delay={0.1}>
          <figure className={cn(
            "relative overflow-hidden rounded-[32px] border border-border/80 bg-muted shadow-[0_28px_60px_-30px_rgb(36_30_24_/_0.16)] dark:shadow-[0_28px_60px_-30px_rgb(0_0_0_/_0.5)]",
            COVER_WIDTH_CLASS
          )}>
            <div className="relative aspect-[16/9] w-full max-h-[68vh]">
              <PostCoverMedia
                src={coverImageUrl}
                alt={title}
                fill
                sizes="(max-width: 1024px) 100vw, 1100px"
                className="h-full w-full object-cover"
                priority
                fetchPriority="high"
                emptyLabel="No cover image"
              />
            </div>
          </figure>
        </FadeIn>

        <div className={ARTICLE_SHELL_CLASS}>
          <div className="min-w-0 w-full 2xl:col-start-2">
            {hasHeadings ? (
              <TableOfContents
                headings={headings}
                offsetTop={112}
                trackActive
                variant="compact"
              />
            ) : null}
            <RichTextViewer
              content={content}
              isSanitized
              className="tiptap-editorial mx-0 max-w-none"
            />
          </div>
          {hasHeadings ? (
            <TableOfContents
              headings={headings}
              offsetTop={112}
              trackActive
              variant="rail"
              className="hidden 2xl:sticky 2xl:col-start-3 2xl:ml-[calc(566px-41ch)] 2xl:block 2xl:w-52"
            />
          ) : null}
        </div>

        <FadeIn y={12} duration={0.45} delay={0.05}>
          <footer className="mx-auto max-w-2xl space-y-5 text-center">
            <p className="text-sm leading-relaxed text-foreground/60">
              Written by <span className="font-medium text-foreground">Meet Tilavat</span>
              {updatedAfterCreated
                ? ` · Last updated ${new Intl.DateTimeFormat("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  }).format(new Date(updatedAt))}`
                : ""}
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/80 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-foreground/75 transition-[transform,border-color,background-color,color] duration-200 hover:-translate-y-px hover:border-foreground/50 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground motion-reduce:transform-none motion-reduce:transition-none"
            >
              <span aria-hidden="true">←</span>
              All posts
            </Link>
          </footer>
        </FadeIn>
      </article>
    </>
  );
}

export default PostDetailArticle;
