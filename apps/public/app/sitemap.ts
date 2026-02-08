import type { MetadataRoute } from "next";
import { getPublishedPosts } from "@/lib/data/posts";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getPublishedPosts();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://meettilavat.com";

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
    const lastModified = new Date(post.updated_at ?? post.created_at ?? Date.now());
    entries.push({
      url: `${baseUrl}/posts/${post.slug}`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8
    });
  });

  return entries;
}

