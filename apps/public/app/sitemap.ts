import type { MetadataRoute } from "next";
import { getPublishedPosts } from "@/lib/posts/repository/public-posts-repository";
import { getConfiguredSiteUrl } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const postsResult = await getPublishedPosts();
  const posts = postsResult.ok ? postsResult.data : [];
  const baseUrl = getConfiguredSiteUrl();

  if (!baseUrl) {
    return [];
  }

  const entries: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      changeFrequency: "weekly",
      priority: 1
    },
    {
      url: `${baseUrl}/resume`,
      changeFrequency: "monthly",
      priority: 0.7
    }
  ];

  posts.forEach((post) => {
    const lastModified = new Date(post.updatedAt ?? post.createdAt ?? Date.now());
    entries.push({
      url: `${baseUrl}/posts/${post.slug}`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8
    });
  });

  return entries;
}
