import { describe, expect, it, vi } from "vitest";
import { dataOk } from "@/lib/data/result";
import { SupabaseBootstrapError } from "@/lib/supabase/bootstrap/env";
import { CookieContextUnavailableError } from "@/lib/supabase/errors/request-client-errors";
import {
  executePostQuery,
  parsePostListQueryResult,
  parsePostRecordQueryResult
} from "./post-query";

const POST_QUERY_MESSAGE = "Failed to load posts";
const POST_QUERY_ERROR_POLICY_OVERRIDES = {
  misconfigured: "Supabase not configured while loading posts."
} as const;

function createLoggerDouble() {
  return {
    error: vi.fn(),
    warn: vi.fn()
  };
}

describe("lib/posts/repository/post-query.ts", () => {
  it("classifies thrown execution failures with explicit kinds and preserves cause details", async () => {
    const logger = createLoggerDouble();
    const scenarios = [
      {
        label: "misconfiguration",
        error: new SupabaseBootstrapError(),
        expected: {
          kind: "misconfigured",
          message: "Supabase not configured while loading posts."
        }
      },
      {
        label: "cookie context unavailable",
        error: new CookieContextUnavailableError(),
        expected: {
          kind: "cookies_unavailable",
          message: "Request cookie context unavailable while loading posts."
        }
      },
      {
        label: "cookie access failure",
        error: new Error("Failed to access request cookies: permission denied"),
        expected: {
          kind: "cookies_access_failed",
          message: "Failed to access request cookies: permission denied"
        }
      },
      {
        label: "unexpected infrastructure failure",
        error: new Error("network unavailable"),
        expected: {
          kind: "infrastructure",
          message: "Failed to execute post repository query.",
          cause: "network unavailable"
        }
      }
    ] as const;

    for (const scenario of scenarios) {
      const result = await executePostQuery({
        run: async () => {
          throw scenario.error;
        },
        query: POST_QUERY_MESSAGE,
        errorPolicyOverrides: POST_QUERY_ERROR_POLICY_OVERRIDES,
        logger
      });

      expect(result, scenario.label).toEqual({
        ok: false,
        error: scenario.expected
      });
    }
  });

  it("returns stable query failures and keeps database diagnostics in cause", async () => {
    const logger = createLoggerDouble();
    const result = await executePostQuery({
      run: async () => ({
        data: null,
        error: { message: "permission denied" } as never
      }),
      query: POST_QUERY_MESSAGE,
      errorPolicyOverrides: POST_QUERY_ERROR_POLICY_OVERRIDES,
      logger
    });

    expect(result).toEqual({
      ok: false,
      error: {
        kind: "query",
        message: "Failed to load posts",
        cause: "permission denied"
      }
    });
    expect(logger.error).not.toHaveBeenCalled();
  });

  it("logs contract-validation failures through the provided logger", () => {
    const logger = createLoggerDouble();
    const listResult = parsePostListQueryResult({
      result: dataOk([{ id: "post-1", title: "missing fields" }]),
      invalidPayloadMessage: "Post list payload failed contract validation.",
      logger
    });
    const recordResult = parsePostRecordQueryResult({
      result: dataOk({ id: "post-1" }),
      invalidPayloadMessage: "Post payload failed contract validation.",
      logger
    });

    expect(listResult).toMatchObject({
      ok: false,
      error: {
        kind: "validation",
        message: "Post list payload failed contract validation."
      }
    });
    if (!listResult.ok) {
      expect(listResult.error.cause).toBeTypeOf("string");
    }

    expect(recordResult).toMatchObject({
      ok: false,
      error: {
        kind: "validation",
        message: "Post payload failed contract validation."
      }
    });
    if (!recordResult.ok) {
      expect(recordResult.error.cause).toBeTypeOf("string");
    }
    expect(logger.error).toHaveBeenCalledTimes(2);
  });
});
