import { describe, expect, it } from "vitest";
import type { User } from "@supabase/supabase-js";
import {
  createSupabaseAuthClientDouble,
  createSupabaseTestEnv
} from "@/tests/support/supabase-testkit";
import { loadSupabaseEnv } from "@/lib/supabase/bootstrap/env";
import { CookieContextUnavailableError } from "@/lib/supabase/errors/request-client-errors";
import { createSupabaseServerClientOrThrow } from "@/lib/supabase/clients/next-request-client";
import { CurrentUserLoadError, getCurrentUserOrThrowWith, getCurrentUserResultWith } from "./current-user";

const TEST_ENV = createSupabaseTestEnv();

describe("lib/auth/current-user.ts", () => {
  it("maps auth getUser responses to user and null via getCurrentUserOrThrowWith", async () => {
    const mockUser = { id: "user-123" } as unknown as User;

    const user = await getCurrentUserOrThrowWith({
      loadClient: async () => createSupabaseAuthClientDouble<User>({ user: mockUser })
    });
    expect(user).toEqual(mockUser);

    const noUser = await getCurrentUserOrThrowWith({
      loadClient: async () => createSupabaseAuthClientDouble<User>()
    });
    expect(noUser).toBeNull();
  });

  it("exposes query failures in getCurrentUserResultWith", async () => {
    const result = await getCurrentUserResultWith({
      loadClient: async () =>
        createSupabaseAuthClientDouble<User>({
          errorMessage: "auth failed"
        })
    });

    expect(result).toEqual({
      ok: false,
      error: {
        kind: "query",
        message: "auth failed"
      }
    });
  });

  it("maps thrown auth.getUser failures to unexpected errors", async () => {
    const result = await getCurrentUserResultWith({
      loadClient: async () =>
        createSupabaseAuthClientDouble<User>({
          throwMessage: "auth transport crashed"
        })
    });

    expect(result).toEqual({
      ok: false,
      error: {
        kind: "unexpected",
        message: "auth transport crashed"
      }
    });
  });

  it("throws classified error from getCurrentUserOrThrowWith when client bootstrap fails", async () => {
    try {
      await getCurrentUserOrThrowWith({
        loadClient: async () => {
          throw new Error("boom");
        }
      });
      throw new Error("Expected getCurrentUserOrThrowWith to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(CurrentUserLoadError);
      if (error instanceof CurrentUserLoadError) {
        expect(error.kind).toBe("unexpected");
        expect(error.message).toBe("boom");
      }
    }
  });

  it("classifies unavailable cookie context in getCurrentUserResultWith", async () => {
    const result = await getCurrentUserResultWith({
      loadClient: async () => {
        throw new CookieContextUnavailableError();
      }
    });

    expect(result).toEqual({
      ok: false,
      error: {
        kind: "cookies_unavailable",
        message: "Request cookie context unavailable while loading current user."
      }
    });
  });

  it("classifies cookie access failures in getCurrentUserResultWith", async () => {
    const result = await getCurrentUserResultWith({
      loadClient: async () =>
        createSupabaseServerClientOrThrow({
          env: TEST_ENV,
          cookieProvider: async () => {
            throw new Error("permission denied");
          }
        })
    });

    expect(result).toEqual({
      ok: false,
      error: {
        kind: "cookies_access_failed",
        message: "Failed to access request cookies: permission denied"
      }
    });
  });

  it("maps getCurrentUserResultWith scenario matrix to stable error kinds", async () => {
    const scenarios: Array<{
      name: string;
      loadClient: () => Promise<{
        auth: {
          getUser: () => Promise<{
            data: {
              user: User | null;
            } | null;
            error: {
              message: string;
            } | null;
          }>;
        };
      }>;
      expected:
        | {
            ok: true;
            user: User | null;
          }
        | {
            ok: false;
            error: {
              kind:
                | "query"
                | "misconfigured"
                | "cookies_unavailable"
                | "cookies_access_failed"
                | "unexpected";
              message: string;
            };
          };
    }> = [
      {
        name: "query failure",
        loadClient: async () =>
          createSupabaseAuthClientDouble<User>({
            errorMessage: "auth failed"
          }),
        expected: {
          ok: false,
          error: {
            kind: "query",
            message: "auth failed"
          }
        }
      },
      {
        name: "misconfigured env",
        loadClient: async () => {
          loadSupabaseEnv({
            url: undefined,
            anonKey: undefined
          });
          throw new Error("unreachable");
        },
        expected: {
          ok: false,
          error: {
            kind: "misconfigured",
            message:
              "Supabase environment variables are missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
          }
        }
      },
      {
        name: "cookie context unavailable",
        loadClient: async () => {
          throw new CookieContextUnavailableError();
        },
        expected: {
          ok: false,
          error: {
            kind: "cookies_unavailable",
            message: "Request cookie context unavailable while loading current user."
          }
        }
      },
      {
        name: "cookie access failure",
        loadClient: async () =>
          createSupabaseServerClientOrThrow({
            env: TEST_ENV,
            cookieProvider: async () => {
              throw new Error("permission denied");
            }
          }),
        expected: {
          ok: false,
          error: {
            kind: "cookies_access_failed",
            message: "Failed to access request cookies: permission denied"
          }
        }
      },
      {
        name: "unexpected failure",
        loadClient: async () => {
          throw new Error("transport offline");
        },
        expected: {
          ok: false,
          error: {
            kind: "unexpected",
            message: "transport offline"
          }
        }
      }
    ];

    for (const scenario of scenarios) {
      const result = await getCurrentUserResultWith({
        loadClient: scenario.loadClient
      });

      expect(result, scenario.name).toEqual(scenario.expected);
    }
  });

  it("keeps parity between result and throwing user-load adapters", async () => {
    const mockUser = { id: "user-42" } as unknown as User;

    const scenarios: Array<{
      loadClient: () => Promise<{
        auth: {
          getUser: () => Promise<{
            data: {
              user: User | null;
            } | null;
            error: {
              message: string;
            } | null;
          }>;
        };
      }>;
      expectedResult:
        | {
            ok: true;
            user: User | null;
          }
        | {
            ok: false;
            error: {
              kind:
                | "query"
                | "misconfigured"
                | "cookies_unavailable"
                | "cookies_access_failed"
                | "unexpected";
              message: string;
            };
          };
    }> = [
      {
        loadClient: async () => createSupabaseAuthClientDouble<User>({ user: mockUser }),
        expectedResult: {
          ok: true,
          user: mockUser
        }
      },
      {
        loadClient: async () => createSupabaseAuthClientDouble<User>(),
        expectedResult: {
          ok: true,
          user: null
        }
      },
      {
        loadClient: async () =>
          createSupabaseAuthClientDouble<User>({
            errorMessage: "auth failed"
          }),
        expectedResult: {
          ok: false,
          error: {
            kind: "query",
            message: "auth failed"
          }
        }
      }
    ];

    for (const scenario of scenarios) {
      const result = await getCurrentUserResultWith({
        loadClient: scenario.loadClient
      });

      expect(result).toEqual(scenario.expectedResult);

      if (result.ok) {
        await expect(
          getCurrentUserOrThrowWith({
            loadClient: scenario.loadClient
          })
        ).resolves.toEqual(result.user);
      } else {
        await expect(
          getCurrentUserOrThrowWith({
            loadClient: scenario.loadClient
          })
        ).rejects.toMatchObject({
          name: "CurrentUserLoadError",
          message: result.error.message,
          kind: result.error.kind
        });
      }
    }
  });
});
