import { createSupabasePublicServerClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { type PostListItem, type PostRecord } from "@/lib/types";
import { unstable_cache } from "next/cache";

const POST_LIST_SELECT = "id,title,slug,excerpt,cover_image_url,status,created_at,updated_at";
const POST_DETAIL_SELECT = "id,title,slug,excerpt,content,cover_image_url,status,author_id,created_at,updated_at";

const getPublishedPostsCached = unstable_cache(
  async () => {
    try {
      const supabase = createSupabasePublicServerClient();

      let data: unknown[] | null = null;
      let error: any = null;

      ({ data, error } = await supabase
        .from("posts")
        .select(POST_LIST_SELECT)
        .eq("status", "published")
        .order("created_at", { ascending: false }));

      if (error) {
        console.error("Failed to load published posts", error.message);
      }

      return (data as PostListItem[]) ?? [];
    } catch (error) {
      console.warn("Supabase not configured, returning empty posts list.");
      return [];
    }
  },
  ["published-posts"],
  { revalidate: 3600, tags: ["posts"] }
);

export async function getPublishedPosts() {
  return getPublishedPostsCached();
}

const getPublishedPostBySlugCached = unstable_cache(
  async (slug: string) => {
    try {
      const supabase = createSupabasePublicServerClient();
      let data: unknown | null = null;
      let error: any = null;

      ({ data, error } = await supabase
        .from("posts")
        .select(POST_DETAIL_SELECT)
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle());

      if (error) {
        console.error(`Failed to load published post for slug ${slug}`, error.message);
        return null;
      }

      return (data as PostRecord | null) ?? null;
    } catch {
      console.warn("Supabase not configured, returning null for post.");
      return null;
    }
  },
  ["published-post-by-slug"],
  { revalidate: 3600, tags: ["posts"] }
);

export async function getPublishedPostBySlug(slug: string) {
  return getPublishedPostBySlugCached(slug);
}

export async function getAllPosts() {
  try {
    const supabase = await createSupabaseServerClient();
    let data: unknown[] | null = null;
    let error: any = null;

    ({ data, error } = await supabase
      .from("posts")
      .select(POST_LIST_SELECT)
      .order("updated_at", { ascending: false }));

    if (error) {
      console.error("Failed to load posts", error.message);
    }

    return (data as PostListItem[]) ?? [];
  } catch (error) {
    console.warn("Supabase not configured, returning empty posts list.");
    return [];
  }
}

export async function getPostBySlug(slug: string) {
  try {
    const supabase = await createSupabaseServerClient();
    let data: unknown | null = null;
    let error: any = null;

    ({ data, error } = await supabase
      .from("posts")
      .select(POST_DETAIL_SELECT)
      .eq("slug", slug)
      .maybeSingle());

    if (error) {
      console.error(`Failed to load post for slug ${slug}`, error.message);
      return null;
    }

    return (data as PostRecord | null) ?? null;
  } catch (error) {
    console.warn("Supabase not configured, returning null for post.");
    return null;
  }
}
