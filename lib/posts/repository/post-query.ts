import { parsePostListItems, parsePostRecord } from "@/lib/posts/contracts/post-contract";
import { dataError, dataOk, type DataResult } from "@/lib/data/result";
import { getErrorMessage } from "@/lib/errors/get-error-message";
import { type PostListItem } from "@/lib/posts/contracts/domain/types";
import { type PostRecordCurrent } from "@/lib/posts/contracts/compat/current";
import { mapSupabaseQueryExecutionErrorToRepositoryResult } from "@/lib/supabase/errors/error-mapping";
import { resolveErrorPolicy } from "@/lib/supabase/errors/error-policy";
import type { PostgrestError } from "@supabase/supabase-js";

export const POST_LIST_SELECT = "id,title,slug,excerpt,cover_image_url,status,created_at,updated_at";
export const POST_DETAIL_SELECT =
  "id,title,slug,excerpt,content,cover_image_url,status,author_id,created_at,updated_at";

type QueryResponse<T> = {
  data: T | null;
  error: PostgrestError | null;
};

type RepositoryLogger = Pick<Console, "error" | "warn">;

type PostQueryErrorPolicy = {
  query: string;
  misconfigured: string;
  cookiesUnavailable: string;
  queryExecution: string;
};

type PostQueryErrorPolicyOverrides = Partial<Omit<PostQueryErrorPolicy, "query">>;

const DEFAULT_POST_QUERY_ERROR_POLICY: Omit<PostQueryErrorPolicy, "query"> = {
  misconfigured: "Supabase is not configured.",
  cookiesUnavailable: "Request cookie context unavailable while loading posts.",
  queryExecution: "Failed to execute post repository query."
};

function createPostQueryErrorPolicy(
  query: string,
  overrides?: PostQueryErrorPolicyOverrides
): PostQueryErrorPolicy {
  return {
    query,
    ...resolveErrorPolicy(DEFAULT_POST_QUERY_ERROR_POLICY, overrides)
  };
}

export async function executePostQuery<T>({
  run,
  query,
  errorPolicyOverrides,
  logger = console
}: {
  run: () => Promise<QueryResponse<T>>;
  query: string;
  errorPolicyOverrides?: PostQueryErrorPolicyOverrides;
  logger?: RepositoryLogger;
}): Promise<DataResult<T | null>> {
  const errorPolicy = createPostQueryErrorPolicy(query, errorPolicyOverrides);

  try {
    const { data, error } = await run();
    if (error) {
      return dataError("query", errorPolicy.query, error.message);
    }
    return dataOk(data ?? null);
  } catch (error) {
    return mapSupabaseQueryExecutionErrorToRepositoryResult({
      error,
      misconfigurationMessage: errorPolicy.misconfigured,
      cookiesUnavailableMessage: errorPolicy.cookiesUnavailable,
      queryExecutionMessage: errorPolicy.queryExecution,
      logger
    });
  }
}

export function parsePostListQueryResult({
  result,
  invalidPayloadMessage,
  logger = console
}: {
  result: DataResult<unknown[] | null>;
  invalidPayloadMessage: string;
  logger?: RepositoryLogger;
}): DataResult<PostListItem[]> {
  if (!result.ok) {
    return result;
  }

  try {
    return dataOk(parsePostListItems(result.data ?? []));
  } catch (error) {
    logger.error(invalidPayloadMessage, error);
    return dataError("validation", invalidPayloadMessage, getErrorMessage(error, "payload validation failed"));
  }
}

export function parsePostRecordQueryResult({
  result,
  invalidPayloadMessage,
  logger = console
}: {
  result: DataResult<unknown | null>;
  invalidPayloadMessage: string;
  logger?: RepositoryLogger;
}): DataResult<PostRecordCurrent | null> {
  if (!result.ok) {
    return result;
  }

  if (result.data === null) {
    return dataOk(null);
  }

  try {
    return dataOk(parsePostRecord(result.data));
  } catch (error) {
    logger.error(invalidPayloadMessage, error);
    return dataError("validation", invalidPayloadMessage, getErrorMessage(error, "payload validation failed"));
  }
}
