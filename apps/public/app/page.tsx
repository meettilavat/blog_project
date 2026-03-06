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

  return (
    <>
      {configuredSiteUrl ? (
        <StructuredDataScript data={buildWebSiteStructuredData(configuredSiteUrl)} />
      ) : null}
      <div className="space-y-10">
        {/* ── Hero ── */}
        <FadeIn className="max-w-2xl space-y-3 pt-2">
          <h1 className="font-serif text-4xl tracking-tight text-foreground sm:text-5xl">
            Notes on building software&nbsp;&amp;&nbsp;systems.
          </h1>
          <p className="text-lg leading-relaxed text-foreground/70">
            Writing about web engineering, infrastructure, and the occasional experiment.
          </p>
          <span className="block h-px w-14 bg-accent/50" aria-hidden="true" />
        </FadeIn>

        {/* ── Posts grid ── */}
        {posts.length === 0 ? (
          <FadeIn delay={0.2}>
            <div className="rounded-3xl border border-dashed border-border/80 bg-card/70 p-10 text-foreground/70">
              <p className="text-base">No posts yet. Fresh writing is on the way.</p>
              <p className="mt-3 text-sm text-foreground/60">
                Until then, visit the{" "}
                <span className="font-medium text-accent">
                  <Link
                    href="/resume"
                    className="underline decoration-accent/40 underline-offset-4 hover:decoration-accent"
                  >
                    resume
                  </Link>
                </span>{" "}
                for background and projects.
              </p>
            </div>
          </FadeIn>
        ) : (
          <StaggeredList
            className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3"
            delay={0.15}
            stagger={0.08}
          >
            {posts.map((post) => (
              <StaggeredItem key={post.id}>
                <PostCard post={post} href={`/posts/${post.slug}`} variant="public" />
              </StaggeredItem>
            ))}
          </StaggeredList>
        )}
      </div>
    </>
  );
}
