"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { type PostStatus } from "@/lib/types";

export async function updateStatusAction(id: string, status: PostStatus) {
  const supabase = await createSupabaseServerClient(true);
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) {
    throw new Error("Not authenticated");
  }

  const { error } = await supabase.from("posts").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
  revalidatePath(`/posts`);
}
