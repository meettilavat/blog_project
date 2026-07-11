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

const READING_WIDTH_CLASS = "mx-auto w-full max-w-[44rem]";
const HEADER_WIDTH_CLASS = "mx-auto w-full max-w-[48rem]";
const COVER_WIDTH_CLASS = "mx-auto w-full max-w-[76rem]";
const ARTICLE_SHELL_CLASS =
  "journal-article-canvas mx-auto grid w-full max-w-[92rem] grid-cols-1 marginalia:grid-cols-[14rem_minmax(0,44rem)_14rem] marginalia:justify-center marginalia:gap-x-8";

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
      <article className="space-y-[clamp(2.5rem,4vw,4rem)]">
        <FadeIn y={12} duration={0.4}>
          <div className={HEADER_WIDTH_CLASS}>
            <Link
              href="/"
              className="group inline-flex min-h-11 items-center gap-3 border-b border-accent/60 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/75 transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
            >
              <span aria-hidden="true">←</span>
              Back to posts
            </Link>
          </div>
        </FadeIn>

        <FadeIn y={20} duration={0.55} delay={0.05}>
          <header className={cn("space-y-7", HEADER_WIDTH_CLASS)}>
            <div className="space-y-5">
              <PostMetaRow
                createdAt={createdAt}
                updatedAt={updatedAt}
                publishedPrefix={publishedPrefix}
                readStats={reading}
                className="flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-[10px] uppercase tracking-[0.16em] text-foreground/70 [font-variant-numeric:tabular-nums]"
              />
              <h1 className="max-w-[24ch] scroll-mt-28 text-balance font-serif text-[clamp(2.65rem,6vw,5.15rem)] leading-[0.99] tracking-[-0.03em] text-foreground">
                {title}
              </h1>
              {excerpt ? (
                <p className="max-w-[62ch] text-pretty text-[clamp(1.08rem,1.8vw,1.3rem)] leading-[1.7] text-foreground/75">
                  {excerpt}
                </p>
              ) : null}
            </div>
            <hr className="border-border/75" />
          </header>
        </FadeIn>

        <FadeIn y={20} duration={0.55} delay={0.1}>
          <figure className={cn(
            "relative overflow-hidden rounded-[12px] border border-border/80 bg-muted",
            COVER_WIDTH_CLASS
          )}>
            <div className="relative aspect-[16/9] w-full">
              <PostCoverMedia
                src={coverImageUrl}
                alt={title}
                fill
                sizes="(max-width: 767px) calc(100vw - 2.5rem), (max-width: 1399px) calc(100vw - 6rem), 1216px"
                className="h-full w-full object-cover object-center"
                priority
                fetchPriority="high"
                emptyLabel="No cover image"
              />
            </div>
          </figure>
        </FadeIn>

        <div className={ARTICLE_SHELL_CLASS}>
          <div className="mx-auto min-w-0 w-full max-w-[44rem] marginalia:col-start-2">
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
              className="hidden marginalia:sticky marginalia:col-start-3 marginalia:block marginalia:w-full"
            />
          ) : null}
        </div>

        <FadeIn y={12} duration={0.45} delay={0.05}>
          <footer className="mx-auto grid max-w-[48rem] gap-5 border-t border-border/75 pt-6 sm:grid-cols-[1fr_auto] sm:items-center">
            <p className="text-sm leading-relaxed text-foreground/70">
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
              className="inline-flex min-h-11 items-center gap-2 border-b border-accent/60 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/75 transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
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
