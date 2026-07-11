import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedPosts } from "@/lib/posts/repository/public-posts-repository";
import { PostCard } from "@/components/posts/post-card";
import { StaggeredList, StaggeredItem } from "@/components/motion/staggered-list";
import { FadeIn } from "@/components/motion/fade-in";
import StructuredDataScript from "@/components/seo/structured-data-script";
import { getConfiguredSiteUrl } from "@/lib/site-url";
import {
  DEFAULT_SOCIAL_IMAGE_ALT,
  DEFAULT_SOCIAL_IMAGE_PATH,
  HOME_PAGE_DESCRIPTION,
  HOME_PAGE_TITLE,
  buildWebSiteStructuredData
} from "@/lib/seo/public-site";

const configuredSiteUrl = getConfiguredSiteUrl();

export const metadata: Metadata = {
  title: HOME_PAGE_TITLE,
  description: HOME_PAGE_DESCRIPTION,
  alternates: {
    canonical: "/"
  },
  openGraph: {
    type: "website",
    url: configuredSiteUrl ?? undefined,
    title: HOME_PAGE_TITLE,
    description: HOME_PAGE_DESCRIPTION,
    images: [
      {
        url: DEFAULT_SOCIAL_IMAGE_PATH,
        alt: DEFAULT_SOCIAL_IMAGE_ALT,
        width: 1200,
        height: 630
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: HOME_PAGE_TITLE,
    description: HOME_PAGE_DESCRIPTION,
    images: [DEFAULT_SOCIAL_IMAGE_PATH]
  }
};

export default async function HomePage() {
  const postsResult = await getPublishedPosts();
  const posts = postsResult.ok ? postsResult.data : [];
  const postsUnavailable = !postsResult.ok;
  const postGridClass =
    posts.length <= 2
      ? "mx-auto grid w-full max-w-[48rem] gap-7 sm:grid-cols-2 lg:grid-cols-2"
      : "grid gap-7 sm:grid-cols-2 lg:grid-cols-3";

  return (
    <>
      {configuredSiteUrl ? (
        <StructuredDataScript data={buildWebSiteStructuredData(configuredSiteUrl)} />
      ) : null}
      <div className="space-y-10">
        {/* ── Hero ── */}
        <FadeIn className="max-w-3xl space-y-4 pt-2">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-foreground/60">
            Meet Tilavat · Software Engineer
          </p>
          <h1 className="font-serif text-4xl tracking-tight text-foreground sm:text-5xl">
            Notes on building software&nbsp;&amp;&nbsp;systems.
          </h1>
          <p className="text-lg leading-relaxed text-foreground/70">
            Writing about web engineering, infrastructure, and the occasional experiment.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-1">
            <Link
              href="/resume"
              className="inline-flex min-h-11 items-center rounded-full border border-border/80 bg-card/75 px-5 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground transition-[border-color,background-color,transform] duration-200 hover:-translate-y-px hover:border-accent/60 hover:bg-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground motion-reduce:transform-none motion-reduce:transition-none"
            >
              View resume <span aria-hidden="true">→</span>
            </Link>
            <span className="block h-px w-14 bg-accent/55" aria-hidden="true" />
          </div>
        </FadeIn>

        {/* ── Posts grid ── */}
        {postsUnavailable ? (
          <FadeIn>
            <div className="rounded-3xl border border-accent/25 bg-card/80 p-8 shadow-soft sm:p-10">
              <p className="font-serif text-2xl text-foreground">Writing is temporarily unavailable.</p>
              <p className="mt-2 max-w-[54ch] text-base leading-relaxed text-foreground/70">
                Please try again shortly. The resume and public links remain available.
              </p>
            </div>
          </FadeIn>
        ) : posts.length === 0 ? (
          <FadeIn delay={0.2}>
            <div className="rounded-3xl border border-dashed border-border/80 bg-card/70 p-10 text-foreground/70">
              <p className="text-base">No posts yet. Fresh writing is on the way.</p>
            </div>
          </FadeIn>
        ) : (
          <StaggeredList
            className={postGridClass}
            delay={0.15}
            stagger={0.08}
          >
            {posts.map((post, index) => (
              <StaggeredItem key={post.id}>
                <PostCard
                  post={post}
                  href={`/posts/${post.slug}`}
                  variant="public"
                  priority={index === 0}
                />
              </StaggeredItem>
            ))}
          </StaggeredList>
        )}
      </div>
    </>
  );
}
