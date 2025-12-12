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

export type SessionUser = {
  id: string;
  email?: string;
};
