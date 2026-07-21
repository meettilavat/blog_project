import { getPublishedPosts } from "@/lib/posts/repository/public-posts-repository";
import { getConfiguredSiteUrl } from "@/lib/site-url";
import {
  HOME_PAGE_DESCRIPTION,
  POST_DESCRIPTION_FALLBACK,
  PUBLIC_SITE_NAME,
  buildPublicPageUrl
} from "@/lib/seo/public-site";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const result = await getPublishedPosts();
  if (!result.ok) {
    return new Response("Feed temporarily unavailable.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  }

  const posts = result.data;
  const siteUrl = getConfiguredSiteUrl() ?? "https://www.meettilavat.com";
  const lastBuild = posts[0] ? new Date(posts[0].createdAt).toUTCString() : new Date().toUTCString();

  const items = posts
    .map((post) => {
      const url = buildPublicPageUrl(`/posts/${post.slug}`, siteUrl);
      const description = post.excerpt?.trim() ? post.excerpt : POST_DESCRIPTION_FALLBACK;
      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <pubDate>${new Date(post.createdAt).toUTCString()}</pubDate>
      <description>${escapeXml(description)}</description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(PUBLIC_SITE_NAME)}</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>${escapeXml(HOME_PAGE_DESCRIPTION)}</description>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    <ttl>60</ttl>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" }
  });
}
