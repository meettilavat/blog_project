import { describe, expect, it } from "vitest";
import { supabaseBoundaryError } from "./supabase-result";

describe("lib/supabase/errors/supabase-result.ts", () => {
  it("returns a typed misconfigured boundary error with cause", () => {
    expect(
      supabaseBoundaryError(
        "misconfigured",
        "Supabase environment is not configured.",
        "Missing NEXT_PUBLIC_SUPABASE_URL."
      )
    ).toEqual({
      ok: false,
      error: {
        kind: "misconfigured",
        message: "Supabase environment is not configured.",
        cause: "Missing NEXT_PUBLIC_SUPABASE_URL."
      }
    });
  });

  it("omits cause when none is provided", () => {
    expect(supabaseBoundaryError("infrastructure", "Failed to create Supabase server client.")).toEqual({
      ok: false,
      error: {
        kind: "infrastructure",
        message: "Failed to create Supabase server client."
      }
    });
  });
});
