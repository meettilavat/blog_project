import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedPosts } from "@/lib/posts/repository/public-posts-repository";
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

  return (
    <>
      {configuredSiteUrl ? (
        <StructuredDataScript data={buildWebSiteStructuredData(configuredSiteUrl)} />
      ) : null}
      <div>
        {postsUnavailable ? (
          <PublicStatusNotice
            label="Index unavailable"
            title="Writing is temporarily unavailable."
            description="Please try again shortly. The résumé and public links remain available."
            headingLevel="h2"
          />
        ) : posts.length === 0 ? (
          <PublicStatusNotice
            label="Index"
            title="No posts yet."
            description="Fresh writing is on the way. The résumé remains available in the meantime."
            headingLevel="h2"
          />
        ) : (
          <ul>
            {posts.map((post) => (
              <li key={post.id}>
                <Link href={`/posts/${post.slug}`}>{post.title}</Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
