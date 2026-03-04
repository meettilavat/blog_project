"use server";

import { revalidatePath, updateTag } from "next/cache";
import { createSupabaseServerClientOrThrow } from "@/lib/supabase/clients/next-request-client";
import { getErrorMessage } from "@/lib/errors/get-error-message";
import { type PostStatus } from "@/lib/posts/contracts/domain/types";
import { actionError, actionOk, type ActionResult } from "@/lib/actions/result";
import { enforcePostOwnership, requireEditorUser } from "@/lib/authz/editor-policy";

export async function updateStatusAction(id: string, status: PostStatus): Promise<ActionResult<null>> {
  let supabase;
  try {
    supabase = await createSupabaseServerClientOrThrow({ access: "write" });
  } catch (error: unknown) {
    return actionError(getErrorMessage(error, "Supabase is not configured."));
  }
  const { data: userData } = await supabase.auth.getUser();
  const authorization = requireEditorUser(userData?.user ?? null, {
    unauthenticatedMessage: "You must be signed in to update post status.",
    forbiddenMessage: "You do not have permission to update post status."
  });
  if (!authorization.ok) {
    return actionError(authorization.message);
  }

  const { error } = await enforcePostOwnership(
    supabase
      .from("posts")
      .update({ status })
      .eq("id", id),
    authorization.user.id
  );
  if (error) {
    return actionError(error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath(`/posts`);
  updateTag("posts");
  return actionOk(null);
}
