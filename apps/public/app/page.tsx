import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedPosts } from "@/lib/posts/repository/public-posts-repository";
import { PostCard } from "@/components/posts/post-card";
import { StaggeredList, StaggeredItem } from "@/components/motion/staggered-list";
import { FadeIn } from "@/components/motion/fade-in";
import PublicStatusNotice from "../components/public-status-notice";
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
const FEATURED_POST_SLUG = "building-tree-census-a-django-and-next-js-platform-from-local-dev-to-production-on-gcp";

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
  const featuredPost = posts.find((post) => post.slug === FEATURED_POST_SLUG) ?? posts[0];
  const fieldNotes = featuredPost ? posts.filter((post) => post.id !== featuredPost.id) : [];
  const fieldNotesClass = fieldNotes.length > 1
    ? "grid gap-x-8 gap-y-2 folio:grid-cols-2"
    : "grid gap-y-2";

  return (
    <>
      {configuredSiteUrl ? (
        <StructuredDataScript data={buildWebSiteStructuredData(configuredSiteUrl)} />
      ) : null}
      <div className="space-y-[clamp(4rem,6vw,5.5rem)]">
        <FadeIn className="grid gap-10 pt-2 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-end">
          <div className="max-w-[62rem] space-y-5">
            <p className="journal-label">Meet Tilavat · Software Engineer</p>
            <h1 className="max-w-[14ch] text-balance font-serif text-[clamp(2.75rem,7vw,6.8rem)] leading-[0.94] tracking-[-0.035em] text-foreground">
              Notes on building software &amp; systems.
            </h1>
            <p className="max-w-[52ch] text-[clamp(1.05rem,1.5vw,1.3rem)] leading-relaxed text-foreground/75">
              Writing about web engineering, infrastructure, and the occasional experiment.
            </p>
            <Link
              href="/resume"
              className="group inline-flex min-h-11 items-center gap-3 border-b border-accent/65 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
            >
              View résumé <span className="transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transform-none" aria-hidden="true">→</span>
            </Link>
          </div>
          <aside className="border-l border-border/75 pl-5 text-sm leading-relaxed text-foreground/70 lg:mb-1" aria-label="Journal index">
            <p className="journal-label">Field index / 2026</p>
            <p className="mt-3 max-w-[30ch]">
              Production notes, operating lessons, and small experiments recorded close to the work.
            </p>
          </aside>
        </FadeIn>

        {/* ── Posts grid ── */}
        {postsUnavailable ? (
          <FadeIn>
            <PublicStatusNotice
              label="Index unavailable"
              title="Writing is temporarily unavailable."
              description="Please try again shortly. The résumé and public links remain available."
              headingLevel="h2"
            />
          </FadeIn>
        ) : posts.length === 0 ? (
          <FadeIn delay={0.2}>
            <PublicStatusNotice
              label="Index / 00"
              title="No posts yet."
              description="Fresh writing is on the way. The résumé remains available in the meantime."
              headingLevel="h2"
            />
          </FadeIn>
        ) : (
          <div className="space-y-[clamp(4rem,8vw,7rem)]">
            {featuredPost ? (
              <section aria-labelledby="selected-work-heading" className="space-y-6">
                <div className="flex items-end justify-between gap-5 border-b border-border/75 pb-3">
                  <div>
                    <p className="journal-label">01 / Principal case study</p>
                    <h2 id="selected-work-heading" className="mt-2 font-serif text-[clamp(2rem,4vw,3.4rem)] leading-none tracking-[-0.025em]">
                      Selected work
                    </h2>
                  </div>
                  <span className="hidden font-mono text-[10px] uppercase tracking-[0.16em] text-foreground/65 sm:block">Field report</span>
                </div>
                <PostCard
                  post={featuredPost}
                  href={`/posts/${featuredPost.slug}`}
                  variant="public"
                  presentation="featured"
                  priority
                />
              </section>
            ) : null}

            {fieldNotes.length > 0 ? (
              <section aria-labelledby="field-notes-heading" className="space-y-5">
                <div className="flex items-end justify-between gap-5 border-b border-border/75 pb-3">
                  <div>
                    <p className="journal-label">02 / Writing &amp; experiments</p>
                    <h2 id="field-notes-heading" className="mt-2 font-serif text-[clamp(1.8rem,3.5vw,2.8rem)] leading-none tracking-[-0.02em]">
                      Field notes
                    </h2>
                  </div>
                  <span className="font-mono text-[10px] tabular-nums text-foreground/65">{String(fieldNotes.length).padStart(2, "0")}</span>
                </div>
                <StaggeredList className={fieldNotesClass} delay={0.15} stagger={0.08}>
                  {fieldNotes.map((post) => (
                    <StaggeredItem key={post.id}>
                      <PostCard
                        post={post}
                        href={`/posts/${post.slug}`}
                        variant="public"
                        presentation="note"
                        priority={false}
                      />
                    </StaggeredItem>
                  ))}
                </StaggeredList>
              </section>
            ) : null}
          </div>
        )}
      </div>
    </>
  );
}
