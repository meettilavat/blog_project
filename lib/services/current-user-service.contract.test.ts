import { describe, expect, it } from "vitest";
import { getCurrentUserResultWith } from "@/lib/auth/current-user";
import { createSupabaseAuthClientDouble } from "@/tests/support/supabase-testkit";
import { createRequireAuthenticatedUserSession } from "./current-user-service";

describe("lib/services/current-user-service contract coverage", () => {
  it("preserves the default unauthenticated message with the real current-user mapper", async () => {
    const requireSession = createRequireAuthenticatedUserSession(
      () =>
        getCurrentUserResultWith({
          loadClient: async () => createSupabaseAuthClientDouble({ user: null })
        })
    );

    const result = await requireSession();

    expect(result).toEqual({
      ok: false,
      error: {
        kind: "unauthenticated",
        message: "You must be signed in."
      }
    });
  });

  it("passes through query errors produced by the current-user boundary mapper", async () => {
    const requireSession = createRequireAuthenticatedUserSession(
      () =>
        getCurrentUserResultWith({
          loadClient: async () =>
            createSupabaseAuthClientDouble({
              errorMessage: "auth offline"
            })
        })
    );

    const result = await requireSession();

    expect(result).toEqual({
      ok: false,
      error: {
        kind: "query",
        message: "auth offline"
      }
    });
  });
});
