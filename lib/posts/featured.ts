import type { PostListItem } from "@/lib/posts/contracts/domain/types";

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
