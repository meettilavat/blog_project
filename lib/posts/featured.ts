import { getPublishedPostBySlug } from "@/lib/posts/repository/public-posts-repository";
import { deriveTiptapContentMetadata } from "@/lib/tiptap/metadata/content-metadata";
import type { PostListItem } from "@/lib/posts/contracts/domain/types";
import type { TiptapDocument } from "@/lib/tiptap/model/tiptap-model";

export const FEATURED_POST_SLUG =
  "building-tree-census-a-django-and-next-js-platform-from-local-dev-to-production-on-gcp";

export type EntryType = "case-study" | "field-note";

export function entryType(slugOrPost: string | Pick<PostListItem, "slug">): EntryType {
  const slug = typeof slugOrPost === "string" ? slugOrPost : slugOrPost.slug;
  return slug === FEATURED_POST_SLUG ? "case-study" : "field-note";
}

export const ENTRY_TYPE_LABEL: Record<EntryType, string> = {
  "case-study": "Case study",
  "field-note": "Field note"
};

export type FeaturedPost = {
  slug: string;
  title: string;
  excerpt?: string | null;
  createdAt: string;
  updatedAt: string;
  minutes: number;
  words: number;
};

export async function getFeaturedPost(posts: PostListItem[]): Promise<FeaturedPost | null> {
  if (posts.length === 0) return null;
  const slug = posts.find((post) => post.slug === FEATURED_POST_SLUG)?.slug ?? posts[0].slug;
  const detail = await getPublishedPostBySlug(slug);
  if (!detail.ok || !detail.data) return null;
  const { reading } = deriveTiptapContentMetadata(detail.data.content as TiptapDocument);
  return {
    slug: detail.data.slug,
    title: detail.data.title,
    excerpt: detail.data.excerpt,
    createdAt: detail.data.createdAt,
    updatedAt: detail.data.updatedAt,
    minutes: reading.minutes,
    words: reading.words
  };
}
