import { createSupabaseServerClientOrThrow } from "@/lib/supabase/clients/next-request-client";
import { dataError, dataOk, type DataAccessError, type DataResult } from "@/lib/data/result";
import { getErrorMessage } from "@/lib/errors/get-error-message";
import { type DraftSummary } from "@/lib/posts/contracts/domain/types";
import { parseDraftSummaries } from "@/lib/posts/contracts/post-contract";
import { mapSupabaseQueryExecutionErrorToRepositoryResult } from "@/lib/supabase/errors/error-mapping";

type DraftsResult = DataResult<DraftSummary[]>;

export class DraftLoadError extends Error {
  readonly kind: string;
  readonly causeDetail?: string;

  constructor(error: DataAccessError) {
    const message =
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof error.message === "string"
        ? error.message
        : "Failed to load drafts.";
    super(message);
    this.name = "DraftLoadError";
    this.kind =
      typeof error === "object" &&
      error !== null &&
      "kind" in error &&
      typeof error.kind === "string"
        ? error.kind
        : "unexpected";
    this.causeDetail =
      typeof error === "object" &&
      error !== null &&
      "cause" in error &&
      typeof error.cause === "string"
        ? error.cause
        : undefined;
  }
}

export async function getDraftsForUserResult(userId: string): Promise<DraftsResult> {
  let supabase: Awaited<ReturnType<typeof createSupabaseServerClientOrThrow>>;
  try {
    supabase = await createSupabaseServerClientOrThrow();
  } catch (error) {
    return mapSupabaseQueryExecutionErrorToRepositoryResult({
      error,
      misconfigurationMessage: "Supabase not configured while loading drafts.",
      cookiesUnavailableMessage: "Request cookie context unavailable while loading drafts.",
      queryExecutionMessage: "Failed to execute drafts query."
    });
  }

  const { data, error } = await supabase
    .from("posts")
    .select("id,title,slug,updated_at")
    .eq("status", "draft")
    .eq("author_id", userId)
    .order("updated_at", { ascending: false })
    .limit(5);

  if (error) {
    return dataError("query", "Failed to load drafts.", error.message);
  }

  try {
    return dataOk(parseDraftSummaries(data ?? []));
  } catch (parseError) {
    return dataError(
      "validation",
      "Draft payload failed contract validation.",
      getErrorMessage(parseError, "payload validation failed")
    );
  }
}

export async function getDraftsForUserOrThrow(userId: string): Promise<DraftSummary[]> {
  const result = await getDraftsForUserResult(userId);
  if (!result.ok) {
    throw new DraftLoadError(result.error);
  }
  return result.data;
}

export const getDraftsForUser = getDraftsForUserResult;
