import { describe, expect, it } from "vitest";
import { SupabaseBootstrapError } from "@/lib/supabase/bootstrap/env";
import {
  CookieContextUnavailableError,
  CookieProviderAccessError
} from "@/lib/supabase/errors/request-client-errors";
import { currentUserQueryError, toCurrentUserBoundaryError } from "./current-user-error";

describe("lib/auth/current-user-error.ts", () => {
  it("maps auth query failures to query-kind errors", () => {
    expect(currentUserQueryError("auth failed")).toEqual({
      kind: "query",
      message: "auth failed"
    });
  });

  it("maps bootstrap failures to misconfigured errors", () => {
    expect(toCurrentUserBoundaryError(new SupabaseBootstrapError())).toEqual({
      kind: "misconfigured",
      message:
        "Supabase environment variables are missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    });
  });

  it("maps cookie provider access failures", () => {
    expect(toCurrentUserBoundaryError(new CookieProviderAccessError("permission denied"))).toEqual({
      kind: "cookies_access_failed",
      message: "permission denied"
    });
  });

  it("maps unavailable cookie context failures", () => {
    expect(toCurrentUserBoundaryError(new CookieContextUnavailableError())).toEqual({
      kind: "cookies_unavailable",
      message: "Request cookie context unavailable while loading current user."
    });
  });

  it("maps unknown failures to unexpected errors", () => {
    expect(toCurrentUserBoundaryError(new Error("transport offline"))).toEqual({
      kind: "unexpected",
      message: "transport offline"
    });
  });
});
