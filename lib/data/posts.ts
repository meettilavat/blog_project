import { createSupabasePublicServerClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { isMissingColumnError } from "@/lib/supabase/errors";
import { type PostRecord } from "@/lib/types";
import { unstable_cache } from "next/cache";

const getPublishedPostsCached = unstable_cache(
  async () => {
    try {
      const supabase = createSupabasePublicServerClient();
      const selectWithExcerpt = "id,title,slug,excerpt,cover_image_url,status,created_at,updated_at";
      const selectBase = "id,title,slug,cover_image_url,status,created_at,updated_at";

      let data: unknown[] | null = null;
      let error: any = null;

      ({ data, error } = await supabase
        .from("posts")
        .select(selectWithExcerpt)
        .eq("status", "published")
        .order("created_at", { ascending: false }));

      if (error && isMissingColumnError(error, "posts", "excerpt")) {
        ({ data, error } = await supabase
          .from("posts")
          .select(selectBase)
          .eq("status", "published")
          .order("created_at", { ascending: false }));
      }

      if (error) {
        console.error("Failed to load published posts", error.message);
      }

      return (data as PostRecord[]) ?? [];
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
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();

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
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Failed to load posts", error.message);
    }

    return (data as PostRecord[]) ?? [];
  } catch (error) {
    console.warn("Supabase not configured, returning empty posts list.");
    return [];
  }
}

export async function getPostBySlug(slug: string) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

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
