import type { PostContent, PostStatus } from "@/lib/posts/contracts/domain/types";

export type PostRecordRow = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content: PostContent;
  cover_image_url: string | null;
  status: PostStatus;
  author_id: string | null;
  created_at: string;
  updated_at: string;
};

export type PostRecordRowCurrent = PostRecordRow;

export type PostListItemRow = Pick<
  PostRecordRow,
  "id" | "title" | "slug" | "excerpt" | "cover_image_url" | "status" | "created_at" | "updated_at"
>;

export type DraftSummaryRow = Pick<PostRecordRow, "id" | "title" | "slug" | "updated_at">;
