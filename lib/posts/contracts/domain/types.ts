export type PostStatus = "draft" | "published";
export type PostContent = Record<string, unknown> | null;

export const POSTS_CONTRACT_SCOPE = "lib/posts/contracts/domain";
export const POSTS_CONTRACT_VERSION = 1 as const;

export type PostRecord = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content: PostContent;
  coverImageUrl: string | null;
  status: PostStatus;
  authorId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PostListItem = Pick<
  PostRecord,
  "id" | "title" | "slug" | "excerpt" | "coverImageUrl" | "status" | "createdAt" | "updatedAt"
>;

export type DraftSummary = Pick<PostRecord, "id" | "title" | "slug" | "updatedAt">;
