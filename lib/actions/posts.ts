"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isMissingColumnError } from "@/lib/supabase/errors";
import { slugify } from "@/lib/utils";
import { type PostStatus } from "@/lib/types";
import type { JSONContent } from "@tiptap/core";

type SavePayload = {
  id?: string;
  title: string;
  excerpt?: string;
  status: PostStatus;
  coverImageUrl?: string | null;
  content: JSONContent | null;
};

export async function savePostAction(payload: SavePayload) {
  let supabase;
  try {
    supabase = await createSupabaseServerClient(true);
  } catch (error: any) {
    return { error: error.message || "Supabase is not configured." };
  }
  const { data: userData } = await supabase.auth.getUser();

  if (!userData?.user) {
    return { error: "You must be signed in to save posts." };
  }

  const slug = slugify(payload.title || "untitled");
  const body = {
    title: payload.title,
    slug,
    excerpt: payload.excerpt?.trim() || null,
    status: payload.status,
    content: payload.content,
    cover_image_url: payload.coverImageUrl || null,
    author_id: userData.user.id,
    updated_at: new Date().toISOString()
  };

  const isEditing = Boolean(payload.id);
  const { excerpt: _excerpt, ...bodyWithoutExcerpt } = body;
  const runQuery = (values: typeof body | typeof bodyWithoutExcerpt) =>
    isEditing
      ? supabase.from("posts").update(values).eq("id", payload.id).select().single()
      : supabase.from("posts").insert(values).select().single();

  let { data, error } = await runQuery(body);

  if (error && isMissingColumnError(error, "posts", "excerpt")) {
    ({ data, error } = await runQuery(bodyWithoutExcerpt));
  }

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath(`/posts/${slug}`);
  revalidatePath(`/editor/${slug}`);
  updateTag("posts");

  return { data, slug };
}

export async function deletePostAction(id: string, slug: string): Promise<void> {
  let supabase;
  try {
    supabase = await createSupabaseServerClient(true);
  } catch (error: any) {
    throw new Error(error.message || "Supabase is not configured.");
  }
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) {
    throw new Error("You must be signed in to delete posts.");
  }

  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath(`/posts/${slug}`);
  updateTag("posts");
  redirect("/dashboard");
}
