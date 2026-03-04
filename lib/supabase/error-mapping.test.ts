import { describe, expect, it, vi } from "vitest";
import { SupabaseBootstrapError } from "./bootstrap/env";
import { CookieContextUnavailableError } from "./errors/request-client-errors";
import {
  mapSupabaseBootstrapErrorToActionMessage,
  mapSupabaseBootstrapErrorToHttpResponse,
  mapSupabaseQueryExecutionErrorToRepositoryResult
} from "./errors/error-mapping";

function createLoggerDouble() {
  return {
    warn: vi.fn(),
    error: vi.fn()
  };
}

describe("lib/supabase/error-mapping.ts", () => {
  it("maps bootstrap failures to boundary-specific action messages with classification-aware logging", () => {
    const logger = createLoggerDouble();
    const message = mapSupabaseBootstrapErrorToActionMessage({
      error: new SupabaseBootstrapError(),
      misconfiguredMessage: "Supabase is not configured.",
      cookiesUnavailableMessage: "Request cookie context unavailable while saving posts.",
      unexpectedMessage: "Supabase is not configured.",
      logger
    });

    expect(message).toBe("Supabase is not configured.");
    expect(logger.error).toHaveBeenCalledWith(
      "Supabase bootstrap failure (misconfigured)",
      expect.stringContaining("Supabase environment variables are missing")
    );
  });

  it("maps cookie-context bootstrap failures to HTTP error payloads", () => {
    const logger = createLoggerDouble();
    const response = mapSupabaseBootstrapErrorToHttpResponse({
      error: new CookieContextUnavailableError(),
      misconfiguredMessage: "Supabase is not configured.",
      cookiesUnavailableMessage: "Request cookie context unavailable while handling image upload.",
      unexpectedMessage: "Supabase is not configured.",
      logger
    });

    expect(response).toEqual({
      status: 500,
      body: {
        error: "Request cookie context unavailable while handling image upload."
      }
    });
    expect(logger.error).toHaveBeenCalledWith(
      "Supabase bootstrap failure (cookies_unavailable)",
      "Request cookie context unavailable while creating Supabase server client."
    );
  });

  it("maps execution failures to repository results while preserving infrastructure cause", () => {
    const logger = createLoggerDouble();
    const unexpectedResult = mapSupabaseQueryExecutionErrorToRepositoryResult({
      error: new Error("network unavailable"),
      misconfigurationMessage: "Supabase not configured while loading posts.",
      cookiesUnavailableMessage: "Request cookie context unavailable while loading posts.",
      queryExecutionMessage: "Failed to execute post repository query.",
      logger
    });

    expect(unexpectedResult).toEqual({
      ok: false,
      error: {
        kind: "infrastructure",
        message: "Failed to execute post repository query.",
        cause: "network unavailable"
      }
    });

    const misconfiguredResult = mapSupabaseQueryExecutionErrorToRepositoryResult({
      error: new Error("Supabase missing"),
      misconfigurationMessage: "Supabase not configured while loading posts.",
      cookiesUnavailableMessage: "Request cookie context unavailable while loading posts.",
      queryExecutionMessage: "Failed to execute post repository query.",
      logger
    });

    expect(misconfiguredResult).toEqual({
      ok: false,
      error: {
        kind: "misconfigured",
        message: "Supabase not configured while loading posts."
      }
    });
    expect(logger.warn).toHaveBeenCalledWith("Supabase not configured while loading posts.");
  });
});
