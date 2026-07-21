import type { Metadata } from "next";
import { getPublishedPosts } from "@/lib/posts/repository/public-posts-repository";
import { getFeaturedPost } from "@/lib/posts/featured";
import PublicStatusNotice from "../components/public-status-notice";
import StructuredDataScript from "@/components/seo/structured-data-script";
import Hero from "@/components/home/hero";
import StartHere from "@/components/home/start-here";
import WritingIndex from "@/components/home/writing-index";
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
  const featured = posts.length > 0 ? await getFeaturedPost(posts) : null;
  const isLatest = featured !== null && posts[0]?.slug === featured.slug;

  return (
    <>
      {configuredSiteUrl ? (
        <StructuredDataScript data={buildWebSiteStructuredData(configuredSiteUrl)} />
      ) : null}
      <div className="space-y-[clamp(4rem,8vw,7rem)]">
        {postsUnavailable ? (
          <PublicStatusNotice
            label="Index unavailable"
            title="Writing is temporarily unavailable."
            description="Please try again shortly. The résumé and public links remain available."
            headingLevel="h2"
          />
        ) : posts.length === 0 || !featured ? (
          <>
            <section aria-label="About Meet Tilavat">
              <p className="kicker">Meet Tilavat</p>
              <p className="mt-4 max-w-[52ch] text-[clamp(1.05rem,1.5vw,1.25rem)] leading-relaxed text-foreground/75">
                Production lessons from running my own stack — the failures included.
              </p>
            </section>
            <PublicStatusNotice
              label="Index"
              title="No posts yet."
              description="Fresh writing is on the way. The résumé remains available in the meantime."
              headingLevel="h2"
            />
          </>
        ) : (
          <>
            <Hero featured={featured} isLatest={isLatest} />
            <StartHere posts={posts} />
            <WritingIndex posts={posts} />
          </>
        )}
      </div>
    </>
  );
}
