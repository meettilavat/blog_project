import { createSupabaseServerClient } from "@/lib/supabase/server";
import { type DraftSummary } from "@/lib/types";

export async function getDraftsForUser(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("posts")
    .select("id,title,slug,updated_at")
    .eq("status", "draft")
    .eq("author_id", userId)
    .order("updated_at", { ascending: false })
    .limit(5);

  if (error) {
    console.error("Failed to load drafts", error.message);
  }

  return (data as DraftSummary[]) ?? [];
}
