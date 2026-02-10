export type PostStatus = "draft" | "published";

export type PostRecord = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content: unknown;
  cover_image_url: string | null;
  status: PostStatus;
  author_id: string | null;
  created_at: string;
  updated_at: string;
};

export type PostListItem = Pick<
  PostRecord,
  "id" | "title" | "slug" | "excerpt" | "cover_image_url" | "status" | "created_at" | "updated_at"
>;

export type DraftSummary = Pick<PostRecord, "id" | "title" | "slug" | "updated_at">;
