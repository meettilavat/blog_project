import { describe, expect, it } from "vitest";
import { SupabaseBootstrapError } from "@/lib/supabase/bootstrap/env";
import {
  CookieContextUnavailableError,
  CookieProviderAccessError
} from "@/lib/supabase/errors/request-client-errors";
import {
  mapSupabaseBoundaryErrorToPostMutationError,
  mapSupabaseBootstrapErrorToPostMutationError,
  postMutationError
} from "./post-action-error";

const ERROR_MESSAGES = {
  misconfigured: "Supabase is not configured.",
  cookiesUnavailable: "Request cookie context unavailable while saving posts.",
  infrastructure: "Failed to initialize post save."
} as const;

describe("apps/admin/features/editor/server/post-action-error.ts", () => {
  it("builds typed mutation errors with optional cause", () => {
    expect(postMutationError("query", "Failed to save post.")).toEqual({
      kind: "query",
      message: "Failed to save post."
    });
    expect(postMutationError("query", "Failed to save post.", "permission denied")).toEqual({
      kind: "query",
      message: "Failed to save post.",
      cause: "permission denied"
    });
  });

  it("maps bootstrap boundary errors to typed mutation kinds", () => {
    const scenarios = [
      {
        name: "Supabase bootstrap error",
        error: new SupabaseBootstrapError(),
        expected: {
          kind: "misconfigured",
          message: ERROR_MESSAGES.misconfigured
        }
      },
      {
        name: "Supabase misconfiguration message pattern",
        error: new Error("Supabase missing"),
        expected: {
          kind: "misconfigured",
          message: ERROR_MESSAGES.misconfigured
        }
      },
      {
        name: "cookie context unavailable class",
        error: new CookieContextUnavailableError("cookies missing"),
        expected: {
          kind: "cookies_unavailable",
          message: ERROR_MESSAGES.cookiesUnavailable
        }
      },
      {
        name: "cookie access failure class",
        error: new CookieProviderAccessError("Failed to access request cookies: permission denied"),
        expected: {
          kind: "cookies_access_failed",
          message: "Failed to access request cookies."
        }
      },
      {
        name: "fallback infrastructure",
        error: new Error("unknown"),
        expected: {
          kind: "infrastructure",
          message: ERROR_MESSAGES.infrastructure
        }
      }
    ] as const;

    for (const scenario of scenarios) {
      const result = mapSupabaseBootstrapErrorToPostMutationError({
        error: scenario.error,
        misconfiguredMessage: ERROR_MESSAGES.misconfigured,
        cookiesUnavailableMessage: ERROR_MESSAGES.cookiesUnavailable,
        infrastructureMessage: ERROR_MESSAGES.infrastructure
      });

      expect(result.kind, scenario.name).toBe(scenario.expected.kind);
      expect(result.message, scenario.name).toBe(scenario.expected.message);
      expect(typeof result.cause, scenario.name).toBe("string");
    }
  });

  it("maps explicit Supabase boundary result errors without throw translation", () => {
    const result = mapSupabaseBoundaryErrorToPostMutationError({
      error: {
        kind: "cookies_unavailable",
        message: "Request cookie context unavailable while creating Supabase server client.",
        cause: "Request cookie context unavailable while creating Supabase server client."
      },
      misconfiguredMessage: ERROR_MESSAGES.misconfigured,
      cookiesUnavailableMessage: ERROR_MESSAGES.cookiesUnavailable,
      infrastructureMessage: ERROR_MESSAGES.infrastructure
    });

    expect(result).toEqual({
      kind: "cookies_unavailable",
      message: ERROR_MESSAGES.cookiesUnavailable,
      cause: "Request cookie context unavailable while creating Supabase server client."
    });
  });
});
