import { SupabaseBootstrapError } from "@/lib/supabase/bootstrap/env";
import { getErrorMessage } from "@/lib/errors/get-error-message";
import {
  CookieProviderAccessError,
  isCookieContextUnavailableError
} from "@/lib/supabase/errors/request-client-errors";
import { SupabaseBoundaryContractError } from "@/lib/supabase/errors/supabase-result";

export type CurrentUserErrorKind =
  | "query"
  | "misconfigured"
  | "cookies_unavailable"
  | "cookies_access_failed"
  | "unexpected";

export type CurrentUserError = {
  kind: CurrentUserErrorKind;
  message: string;
};

export function currentUserQueryError(message: string): CurrentUserError {
  return {
    kind: "query",
    message
  };
}

export function toCurrentUserBoundaryError(error: unknown): CurrentUserError {
  if (error instanceof SupabaseBoundaryContractError) {
    switch (error.kind) {
      case "misconfigured":
        return {
          kind: "misconfigured",
          message: error.message
        };
      case "cookies_unavailable":
        return {
          kind: "cookies_unavailable",
          message: error.message
        };
      case "cookies_access_failed":
        return {
          kind: "cookies_access_failed",
          message: error.message
        };
      case "infrastructure":
        return {
          kind: "unexpected",
          message: error.causeDetail ?? error.message
        };
      default:
        return {
          kind: "unexpected",
          message: error.message
        };
    }
  }

  if (error instanceof SupabaseBootstrapError) {
    return {
      kind: "misconfigured",
      message: error.message
    };
  }

  if (error instanceof CookieProviderAccessError) {
    return {
      kind: error.kind,
      message: error.message
    };
  }

  if (isCookieContextUnavailableError(error)) {
    return {
      kind: "cookies_unavailable",
      message: "Request cookie context unavailable while loading current user."
    };
  }

  return {
    kind: "unexpected",
    message: getErrorMessage(error, "Unexpected error while loading current user.")
  };
}
