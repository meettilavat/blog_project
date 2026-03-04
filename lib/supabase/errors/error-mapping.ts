import { SupabaseBootstrapError } from "../bootstrap/env";
import { getErrorMessage } from "@/lib/errors/get-error-message";
import {
  CookieContextUnavailableError,
  CookieProviderAccessError,
  isCookieContextUnavailableError
} from "./request-client-errors";
import {
  SupabaseBoundaryContractError,
  supabaseBoundaryError,
  type SupabaseBoundaryResult
} from "./supabase-result";

type BoundaryLogger = Pick<Console, "warn" | "error">;

type SupabaseBoundaryFailureKind =
  | "misconfigured"
  | "cookies_unavailable"
  | "cookies_access_failed"
  | "unexpected";

type SupabaseBoundaryFailure = {
  kind: SupabaseBoundaryFailureKind;
  message: string;
  cause: string;
};

const SUPABASE_MISCONFIGURATION_PATTERNS = [
  "supabase environment variables are missing",
  "supabase missing",
  "supabase is not configured",
  "supabase not configured"
];

function isSupabaseMisconfiguration(error: unknown): boolean {
  if (error instanceof SupabaseBootstrapError) {
    return true;
  }
  const message = getErrorMessage(error, "").toLowerCase();
  return SUPABASE_MISCONFIGURATION_PATTERNS.some((pattern) => message.includes(pattern));
}

function classifySupabaseBoundaryFailure({
  error,
  misconfiguredMessage,
  cookiesUnavailableMessage,
  unexpectedMessage
}: {
  error: unknown;
  misconfiguredMessage: string;
  cookiesUnavailableMessage: string;
  unexpectedMessage: string;
}): SupabaseBoundaryFailure {
  const cause = getErrorMessage(error, "unknown error");

  if (error instanceof SupabaseBoundaryContractError) {
    switch (error.kind) {
      case "misconfigured":
        return {
          kind: "misconfigured",
          message: misconfiguredMessage,
          cause: error.causeDetail ?? error.message
        };
      case "cookies_unavailable":
        return {
          kind: "cookies_unavailable",
          message: cookiesUnavailableMessage,
          cause: error.causeDetail ?? error.message
        };
      case "cookies_access_failed":
        return {
          kind: "cookies_access_failed",
          message: error.message,
          cause: error.causeDetail ?? error.message
        };
      case "infrastructure":
        return {
          kind: "unexpected",
          message: unexpectedMessage,
          cause: error.causeDetail ?? error.message
        };
      default:
        return {
          kind: "unexpected",
          message: unexpectedMessage,
          cause: error.causeDetail ?? error.message
        };
    }
  }

  if (isSupabaseMisconfiguration(error)) {
    return {
      kind: "misconfigured",
      message: misconfiguredMessage,
      cause
    };
  }

  if (error instanceof CookieContextUnavailableError || isCookieContextUnavailableError(error)) {
    return {
      kind: "cookies_unavailable",
      message: cookiesUnavailableMessage,
      cause
    };
  }

  if (error instanceof CookieProviderAccessError || cause.toLowerCase().includes("failed to access request cookies")) {
    return {
      kind: "cookies_access_failed",
      message: cause,
      cause
    };
  }

  return {
    kind: "unexpected",
    message: unexpectedMessage,
    cause
  };
}

export function mapSupabaseBootstrapErrorToActionMessage({
  error,
  misconfiguredMessage,
  cookiesUnavailableMessage,
  unexpectedMessage,
  logger = console
}: {
  error: unknown;
  misconfiguredMessage: string;
  cookiesUnavailableMessage: string;
  unexpectedMessage: string;
  logger?: BoundaryLogger;
}) {
  const failure = classifySupabaseBoundaryFailure({
    error,
    misconfiguredMessage,
    cookiesUnavailableMessage,
    unexpectedMessage
  });
  logger.error(`Supabase bootstrap failure (${failure.kind})`, failure.cause);
  return failure.message;
}

export function mapSupabaseBootstrapErrorToHttpResponse({
  error,
  misconfiguredMessage,
  cookiesUnavailableMessage,
  unexpectedMessage,
  logger = console
}: {
  error: unknown;
  misconfiguredMessage: string;
  cookiesUnavailableMessage: string;
  unexpectedMessage: string;
  logger?: BoundaryLogger;
}) {
  const failure = classifySupabaseBoundaryFailure({
    error,
    misconfiguredMessage,
    cookiesUnavailableMessage,
    unexpectedMessage
  });
  logger.error(`Supabase bootstrap failure (${failure.kind})`, failure.cause);
  return {
    status: 500,
    body: {
      error: failure.message
    }
  };
}

export function mapSupabaseQueryExecutionErrorToRepositoryResult({
  error,
  misconfigurationMessage,
  cookiesUnavailableMessage,
  queryExecutionMessage,
  logger = console
}: {
  error: unknown;
  misconfigurationMessage: string;
  cookiesUnavailableMessage: string;
  queryExecutionMessage: string;
  logger?: BoundaryLogger;
}): SupabaseBoundaryResult<never> {
  const failure = classifySupabaseBoundaryFailure({
    error,
    misconfiguredMessage: misconfigurationMessage,
    cookiesUnavailableMessage,
    unexpectedMessage: queryExecutionMessage
  });

  switch (failure.kind) {
    case "misconfigured":
      logger.warn(failure.message);
      return supabaseBoundaryError("misconfigured", failure.message);
    case "cookies_unavailable":
      return supabaseBoundaryError("cookies_unavailable", failure.message);
    case "cookies_access_failed":
      return supabaseBoundaryError("cookies_access_failed", failure.message);
    case "unexpected":
      return supabaseBoundaryError("infrastructure", queryExecutionMessage, failure.cause);
    default:
      return supabaseBoundaryError("infrastructure", queryExecutionMessage, failure.cause);
  }
}
