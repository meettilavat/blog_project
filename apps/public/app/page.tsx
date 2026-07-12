import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedPosts } from "@/lib/posts/repository/public-posts-repository";
import { Masthead } from "@/components/layout/masthead";
import { FigurePlate } from "@/components/posts/figure-plate";
import { EntryLedger } from "@/components/posts/entry-ledger";
import PostMetaRow from "@/components/posts/post-meta-row";
import { FadeIn } from "@/components/motion/fade-in";
import PublicStatusNotice from "../components/public-status-notice";
import StructuredDataScript from "@/components/seo/structured-data-script";
import { getConfiguredSiteUrl } from "@/lib/site-url";
import { FEATURED_POST_SLUG } from "@/lib/posts/featured";
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
  const featuredPost = posts.find((post) => post.slug === FEATURED_POST_SLUG) ?? posts[0];
  const ledgerEntries = posts.length > 1 ? posts : [];

  return (
    <>
      {configuredSiteUrl ? (
        <StructuredDataScript data={buildWebSiteStructuredData(configuredSiteUrl)} />
      ) : null}
      <div className="space-y-[clamp(4rem,8vw,7rem)]">
        <FadeIn>
          <Masthead
            eyebrow="Meet Tilavat · Software Engineer"
            title={<>Notes on building software &amp; systems.</>}
            dek="Writing about web engineering, infrastructure, and the occasional experiment."
            note="Production notes, operating lessons, and small experiments recorded close to the work."
            resumeHref="/resume"
          />
        </FadeIn>

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
          <>
            {featuredPost ? (
              <FadeIn>
                <section aria-labelledby="selected-work-heading" className="space-y-6">
                  <div className="flex items-end justify-between gap-5 border-b border-border/75 pb-3">
                    <div>
                      <p className="journal-label">01 / Principal case study</p>
                      <h2 id="selected-work-heading" className="mt-2 font-serif text-[clamp(2rem,4vw,3.4rem)] leading-none tracking-[-0.025em]">Selected work</h2>
                    </div>
                    <span className="hidden font-mono text-[10px] uppercase tracking-[0.16em] text-foreground/65 sm:block">Field report</span>
                  </div>
                  <Link href={`/posts/${featuredPost.slug}`} className="group grid min-w-0 gap-6 spread:grid-cols-[minmax(0,3fr)_minmax(22rem,2fr)] spread:items-start spread:gap-[clamp(2rem,4vw,4.5rem)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground">
                    <FigurePlate figureLabel="Fig. 01" src={featuredPost.coverImageUrl} alt={featuredPost.title} sizes="(max-width: 1279px) calc(100vw - 2.5rem), (max-width: 1599px) 58vw, 840px" priority />
                    <div className="flex min-w-0 flex-col gap-6 py-1">
                      <PostMetaRow createdAt={featuredPost.createdAt} updatedAt={featuredPost.updatedAt} className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10px] uppercase tracking-[0.16em] text-foreground/70 [font-variant-numeric:tabular-nums]" />
                      <h3 className="max-w-[18ch] text-balance font-serif text-[clamp(2rem,4vw,3.4rem)] font-semibold leading-[1.02] tracking-[-0.025em] text-foreground transition-colors group-hover:text-accent">{featuredPost.title}</h3>
                      {featuredPost.excerpt ? <p className="max-w-[56ch] text-pretty leading-[1.75] text-foreground/75">{featuredPost.excerpt}</p> : null}
                      <span className="flex items-center gap-3 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/75">Read case study<span className="h-px w-10 bg-accent transition-transform group-hover:scale-x-125" aria-hidden="true" /><span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span></span>
                    </div>
                  </Link>
                </section>
              </FadeIn>
            ) : null}

            {ledgerEntries.length > 0 ? (
              <FadeIn><EntryLedger entries={ledgerEntries} /></FadeIn>
            ) : null}
          </>
        )}
      </div>
    </>
  );
}
