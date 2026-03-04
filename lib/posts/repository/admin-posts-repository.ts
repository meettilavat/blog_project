import { createSupabaseServerClientOrThrow } from "@/lib/supabase/clients/next-request-client";
import { type DataResult } from "@/lib/data/result";
import { type PostListItem } from "@/lib/posts/contracts/domain/types";
import { type PostRecordCurrent } from "@/lib/posts/contracts/compat/current";
import {
  executePostQuery,
  parsePostListQueryResult,
  parsePostRecordQueryResult,
  POST_DETAIL_SELECT,
  POST_LIST_SELECT
} from "@/lib/posts/repository/post-query";

export async function getAllPosts(): Promise<DataResult<PostListItem[]>> {
  const result = await executePostQuery<unknown[]>({
    run: async () => {
      const supabase = await createSupabaseServerClientOrThrow();
      return supabase
        .from("posts")
        .select(POST_LIST_SELECT)
        .order("updated_at", { ascending: false });
    },
    query: "Failed to load posts",
    errorPolicyOverrides: {
      misconfigured: "Supabase not configured while loading posts."
    }
  });

  return parsePostListQueryResult({
    result,
    invalidPayloadMessage: "Post list payload failed contract validation."
  });
}

export async function getPostBySlug(slug: string): Promise<DataResult<PostRecordCurrent | null>> {
  const result = await executePostQuery<unknown>({
    run: async () => {
      const supabase = await createSupabaseServerClientOrThrow();
      return supabase
        .from("posts")
        .select(POST_DETAIL_SELECT)
        .eq("slug", slug)
        .maybeSingle();
    },
    query: `Failed to load post for slug ${slug}`,
    errorPolicyOverrides: {
      misconfigured: "Supabase not configured while loading post."
    }
  });

  return parsePostRecordQueryResult({
    result,
    invalidPayloadMessage: "Post payload failed contract validation."
  });
}
