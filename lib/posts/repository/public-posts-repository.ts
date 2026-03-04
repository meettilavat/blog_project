import { createSupabasePublicServerClient } from "@/lib/supabase/clients/public-client";
import { unstable_cache } from "next/cache";
import {
  executePostQuery,
  parsePostListQueryResult,
  parsePostRecordQueryResult,
  POST_DETAIL_SELECT,
  POST_LIST_SELECT
} from "@/lib/posts/repository/post-query";

export const getPublishedPosts = unstable_cache(
  async () => {
    const result = await executePostQuery<unknown[]>({
      run: async () => {
        const supabase = createSupabasePublicServerClient();
        return supabase
          .from("posts")
          .select(POST_LIST_SELECT)
          .eq("status", "published")
          .order("created_at", { ascending: false });
      },
      query: "Failed to load published posts",
      errorPolicyOverrides: {
        misconfigured: "Supabase not configured while loading published posts."
      }
    });

    return parsePostListQueryResult({
      result,
      invalidPayloadMessage: "Published posts payload failed contract validation."
    });
  },
  ["published-posts"],
  { revalidate: 3600, tags: ["posts"] }
);

export const getPublishedPostBySlug = unstable_cache(
  async (slug: string) => {
    const result = await executePostQuery<unknown>({
      run: async () => {
        const supabase = createSupabasePublicServerClient();
        return supabase
          .from("posts")
          .select(POST_DETAIL_SELECT)
          .eq("slug", slug)
          .eq("status", "published")
          .maybeSingle();
      },
      query: `Failed to load published post for slug ${slug}`,
      errorPolicyOverrides: {
        misconfigured: "Supabase not configured while loading published post."
      }
    });

    return parsePostRecordQueryResult({
      result,
      invalidPayloadMessage: "Published post payload failed contract validation."
    });
  },
  ["published-post-by-slug"],
  { revalidate: 3600, tags: ["posts"] }
);
