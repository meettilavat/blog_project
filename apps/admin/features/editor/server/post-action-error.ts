import { SupabaseBootstrapError } from "@/lib/supabase/bootstrap/env";
import type { DataAccessError } from "@/lib/data/result";
import { getErrorMessage } from "@/lib/errors/get-error-message";
import type { SupabaseBoundaryErrorKind } from "@/lib/supabase/errors/supabase-result";
import {
  CookieContextUnavailableError,
  CookieProviderAccessError,
  isCookieContextUnavailableError
} from "@/lib/supabase/errors/request-client-errors";

export type PostMutationErrorKind =
  | "unauthenticated"
  | "forbidden"
  | "misconfigured"
  | "cookies_unavailable"
  | "cookies_access_failed"
  | "query"
  | "validation"
  | "infrastructure";

export type PostMutationError = {
  kind: PostMutationErrorKind;
  message: string;
  cause?: string;
};

const SUPABASE_MISCONFIGURATION_PATTERNS = [
  "supabase environment variables are missing",
  "supabase missing",
  "supabase is not configured",
  "supabase not configured"
];

type SupabaseBoundaryError = DataAccessError<SupabaseBoundaryErrorKind>;

export function postMutationError(
  kind: PostMutationErrorKind,
  message: string,
  cause?: string
): PostMutationError {
  if (cause) {
    return {
      kind,
      message,
      cause
    };
  }
  return {
    kind,
    message
  };
}

export function mapSupabaseBoundaryErrorToPostMutationError({
  error,
  misconfiguredMessage,
  cookiesUnavailableMessage,
  infrastructureMessage
}: {
  error: SupabaseBoundaryError;
  misconfiguredMessage: string;
  cookiesUnavailableMessage: string;
  infrastructureMessage: string;
}): PostMutationError {
  const cause = error.cause ?? error.message;

  switch (error.kind) {
    case "misconfigured":
      return postMutationError("misconfigured", misconfiguredMessage, cause);
    case "cookies_unavailable":
      return postMutationError("cookies_unavailable", cookiesUnavailableMessage, cause);
    case "cookies_access_failed":
      return postMutationError("cookies_access_failed", "Failed to access request cookies.", cause);
    case "infrastructure":
      return postMutationError("infrastructure", infrastructureMessage, cause);
    default:
      return postMutationError("infrastructure", infrastructureMessage, cause);
  }
}

export function mapSupabaseBootstrapErrorToPostMutationError({
  error,
  misconfiguredMessage,
  cookiesUnavailableMessage,
  infrastructureMessage
}: {
  error: unknown;
  misconfiguredMessage: string;
  cookiesUnavailableMessage: string;
  infrastructureMessage: string;
}): PostMutationError {
  const cause = getErrorMessage(error, "unknown error");
  const normalizedCause = cause.toLowerCase();
  const boundaryKind: SupabaseBoundaryErrorKind =
    error instanceof SupabaseBootstrapError ||
    SUPABASE_MISCONFIGURATION_PATTERNS.some((pattern) => normalizedCause.includes(pattern))
      ? "misconfigured"
      : error instanceof CookieContextUnavailableError || isCookieContextUnavailableError(error)
        ? "cookies_unavailable"
        : error instanceof CookieProviderAccessError
          ? "cookies_access_failed"
          : "infrastructure";

  return mapSupabaseBoundaryErrorToPostMutationError({
    error: {
      kind: boundaryKind,
      message: cause,
      cause
    },
    misconfiguredMessage,
    cookiesUnavailableMessage,
    infrastructureMessage
  });
}
