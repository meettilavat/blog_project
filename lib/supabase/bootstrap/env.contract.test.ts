import { describe, expect, it } from "vitest";
import { buildHttpsUrl } from "@/lib/config/http-url";
import { loadSupabaseEnv, SupabaseBootstrapError } from "./env";

const TEST_SUPABASE_URL = buildHttpsUrl("example.supabase.co");

describe("lib/supabase/bootstrap/env.ts contract", () => {
  it("throws stable bootstrap error when URL is missing", () => {
    expect(() =>
      loadSupabaseEnv({
        url: undefined,
        anonKey: "anon-key"
      })
    ).toThrow(SupabaseBootstrapError);

    try {
      loadSupabaseEnv({
        url: undefined,
        anonKey: "anon-key"
      });
    } catch (error) {
      expect(error).toBeInstanceOf(SupabaseBootstrapError);
      if (error instanceof SupabaseBootstrapError) {
        expect(error.name).toBe("SupabaseBootstrapError");
        expect(error.kind).toBe("missing_env");
        expect(error.message).toBe(
          "Supabase environment variables are missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
        );
      }
    }
  });

  it("throws stable bootstrap error when anon key is missing", () => {
    expect(() =>
      loadSupabaseEnv({
        url: TEST_SUPABASE_URL,
        anonKey: undefined
      })
    ).toThrow(SupabaseBootstrapError);
  });

  it("returns configured environment when required values are present", () => {
    expect(
      loadSupabaseEnv({
        url: TEST_SUPABASE_URL,
        anonKey: "anon-key"
      })
    ).toEqual({
      url: TEST_SUPABASE_URL,
      anonKey: "anon-key"
    });
  });
});
