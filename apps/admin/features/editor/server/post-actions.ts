"use server";

import { revalidatePath, updateTag } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/clients/next-request-client";
import { slugify } from "@/lib/content/slug";
import { parsePostRecord } from "@/lib/posts/contracts/post-contract";
import {
  type PostContent,
  type PostStatus
} from "@/lib/posts/contracts/domain/types";
import { type PostRecordCurrent } from "@/lib/posts/contracts/compat/current";
import { actionError, actionOk, type ActionResult } from "@/lib/actions/result";
import { enforcePostOwnership, requireEditorUser } from "@/lib/authz/editor-policy";
import {
  getEditorOperationPolicy,
  type EditorOperation
} from "@/lib/authz/editor-operation-policy";
import {
  mapSupabaseBoundaryErrorToPostMutationError,
  postMutationError,
  type PostMutationError
} from "./post-action-error";
import type { SupabaseServerClient } from "@/lib/supabase/contracts/client-boundary";

type RequestSupabaseClient = SupabaseServerClient;

type SavePayload = {
  id?: string;
  title: string;
  excerpt?: string;
  status: PostStatus;
  coverImageUrl?: string | null;
  content: PostContent;
};

type EditorContext = {
  supabase: RequestSupabaseClient;
  userId: string;
};

async function withAuthorizedEditorContext(
  operation: EditorOperation
): Promise<ActionResult<EditorContext, PostMutationError>> {
  const policy = getEditorOperationPolicy(operation);
  const supabaseResult = await createSupabaseServerClient({ access: "write" });
  if (!supabaseResult.ok) {
    return actionError(
      mapSupabaseBoundaryErrorToPostMutationError({
        error: supabaseResult.error,
        misconfiguredMessage: policy.supabaseMisconfiguredMessage,
        cookiesUnavailableMessage: policy.cookiesUnavailableMessage,
        infrastructureMessage: policy.infrastructureMessage
      })
    );
  }
  const supabase = supabaseResult.data;

  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError) {
    return actionError(
      postMutationError("infrastructure", policy.infrastructureMessage, authError.message)
    );
  }

  const authorization = requireEditorUser(userData?.user ?? null, {
    unauthenticatedMessage: policy.unauthenticatedMessage,
    forbiddenMessage: policy.forbiddenMessage
  });
  if (!authorization.ok) {
    return actionError(
      postMutationError(
        authorization.status === 401 ? "unauthenticated" : "forbidden",
        authorization.message
      )
    );
  }

  return actionOk({ supabase, userId: authorization.user.id });
}

function buildPostMutationValues(payload: SavePayload, userId: string, slug: string) {
  return {
    title: payload.title,
    slug,
    excerpt: payload.excerpt?.trim() || null,
    status: payload.status,
    content: payload.content,
    cover_image_url: payload.coverImageUrl || null,
    author_id: userId,
    updated_at: new Date().toISOString()
  };
}

function persistPostRecord({
  supabase,
  userId,
  payload,
  values
}: {
  supabase: RequestSupabaseClient;
  userId: string;
  payload: SavePayload;
  values: ReturnType<typeof buildPostMutationValues>;
}) {
  if (payload.id) {
    return enforcePostOwnership(
      supabase
        .from("posts")
        .update(values)
        .eq("id", payload.id),
      userId
    )
      .select()
      .single();
  }

  return supabase.from("posts").insert(values).select().single();
}

function revalidatePostViews({ slug, includeEditor }: { slug: string; includeEditor: boolean }) {
  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath(`/posts/${slug}`);
  if (includeEditor) {
    revalidatePath(`/editor/${slug}`);
  }
  updateTag("posts");
}

export async function savePostAction(
  payload: SavePayload
): Promise<ActionResult<{ post: PostRecordCurrent; slug: string }, PostMutationError>> {
  const context = await withAuthorizedEditorContext("save_post");
  if (!context.ok) {
    return context;
  }

  const slug = slugify(payload.title || "untitled");
  const values = buildPostMutationValues(payload, context.data.userId, slug);
  const { data, error } = await persistPostRecord({
    supabase: context.data.supabase,
    userId: context.data.userId,
    payload,
    values
  });

  if (error) {
    return actionError(postMutationError("query", "Failed to save post.", error.message));
  }

  if (!data) {
    return actionError(postMutationError("infrastructure", "Saved post payload was empty."));
  }

  let postRecord: PostRecordCurrent;
  try {
    postRecord = parsePostRecord(data);
  } catch (contractError) {
    console.error("Saved post payload failed contract validation.", contractError);
    return actionError(
      postMutationError("validation", "Saved post payload failed contract validation.")
    );
  }

  revalidatePostViews({
    slug,
    includeEditor: true
  });

  return actionOk({ post: postRecord, slug });
}

export async function deletePostAction(
  id: string,
  slug: string
): Promise<ActionResult<null, PostMutationError>> {
  const context = await withAuthorizedEditorContext("delete_post");
  if (!context.ok) {
    return context;
  }

  const { error } = await enforcePostOwnership(
    context.data.supabase
      .from("posts")
      .delete()
      .eq("id", id),
    context.data.userId
  );
  if (error) {
    return actionError(postMutationError("query", "Failed to delete post.", error.message));
  }

  revalidatePostViews({
    slug,
    includeEditor: false
  });

  return actionOk(null);
}
