import { describe, expect, it, vi } from "vitest";
import {
  createSupabaseCookieStoreDouble,
  createSupabaseTestEnv
} from "@/tests/support/supabase-testkit";
import {
  CookieContextUnavailableError,
  isCookieContextUnavailableError
} from "@/lib/supabase/errors/request-client-errors";
import {
  createSupabaseRequestClient,
} from "./server-client-factory";

const TEST_ENV = createSupabaseTestEnv();

describe("lib/supabase/clients/server-client-factory.ts", () => {
  it("detects explicit cookie-context unavailable error signals", () => {
    const nextRequestScopeError = Object.defineProperty(
      new Error("dynamic API context missing"),
      "__NEXT_ERROR_CODE",
      {
        value: "E251",
        enumerable: false
      }
    );

    expect(isCookieContextUnavailableError(new CookieContextUnavailableError())).toBe(true);
    expect(isCookieContextUnavailableError(nextRequestScopeError)).toBe(true);
    expect(isCookieContextUnavailableError(new Error("dynamic API context missing"))).toBe(false);
    expect(isCookieContextUnavailableError(new Error("permission denied"))).toBe(false);
  });

  it("returns cookies_unavailable result in strict request mode", async () => {
    const result = await createSupabaseRequestClient({
      env: TEST_ENV,
      cookieProvider: async () => {
        throw new CookieContextUnavailableError();
      }
    });

    expect(result).toEqual({
      ok: false,
      error: {
        kind: "cookies_unavailable",
        message: "Request cookie context unavailable while creating Supabase server client.",
        cause: "Request cookie context unavailable while creating Supabase server client."
      }
    });
  });

  it("applies boundary error policy overrides when provided", async () => {
    const result = await createSupabaseRequestClient({
      env: TEST_ENV,
      errorPolicyOverrides: {
        cookiesUnavailable: "Cookie scope unavailable for request-bound client."
      },
      cookieProvider: async () => {
        throw new CookieContextUnavailableError();
      }
    });

    expect(result).toEqual({
      ok: false,
      error: {
        kind: "cookies_unavailable",
        message: "Cookie scope unavailable for request-bound client.",
        cause: "Request cookie context unavailable while creating Supabase server client."
      }
    });
  });

  it("treats null cookie stores as unavailable in strict request mode", async () => {
    const result = await createSupabaseRequestClient({
      env: TEST_ENV,
      cookieProvider: async () => null
    });

    expect(result).toEqual({
      ok: false,
      error: {
        kind: "cookies_unavailable",
        message: "Request cookie context unavailable while creating Supabase server client.",
        cause: "Request cookie context unavailable while creating Supabase server client."
      }
    });
  });

  it("allows missing cookie context only when explicitly enabled", async () => {
    let capturedOptions:
      | {
          cookies: {
            getAll: () => Array<{ name: string; value: string }>;
          };
        }
      | null = null;
    const createServerClientImpl = vi.fn((_url: string, _anonKey: string, options: unknown) => {
      capturedOptions = options as typeof capturedOptions;
      return { ok: true };
    });

    const result = await createSupabaseRequestClient({
      env: TEST_ENV,
      cookieContextPolicy: "allow-missing",
      cookieProvider: async () => {
        throw new CookieContextUnavailableError();
      },
      createServerClientImpl
    });

    expect(result).toEqual({
      ok: true,
      data: { ok: true }
    });
    expect(capturedOptions?.cookies.getAll()).toEqual([]);
  });

  it("returns cookies_access_failed result for non-context cookie failures", async () => {
    const result = await createSupabaseRequestClient({
      env: TEST_ENV,
      cookieProvider: async () => {
        throw new Error("permission denied");
      }
    });

    expect(result).toEqual({
      ok: false,
      error: {
        kind: "cookies_access_failed",
        message: "Failed to access request cookies.",
        cause: "Failed to access request cookies: permission denied"
      }
    });
  });

  it("writes cookies only when write policy is read-write", async () => {
    const cookieStore = createSupabaseCookieStoreDouble();
    let capturedOptions:
      | {
          cookies: {
            setAll: (cookies: Array<{ name: string; value: string; options: { path: string } }>) => void;
          };
        }
      | null = null;
    const createServerClientImpl = vi.fn((_url: string, _anonKey: string, options: unknown) => {
      capturedOptions = options as typeof capturedOptions;
      return {};
    });

    const writableClientResult = await createSupabaseRequestClient({
      env: TEST_ENV,
      cookieWritePolicy: "read-write",
      cookieProvider: async () => cookieStore,
      createServerClientImpl
    });
    expect(writableClientResult.ok).toBe(true);
    capturedOptions?.cookies.setAll([
      {
        name: "sb-refresh-token",
        value: "next",
        options: { path: "/" }
      }
    ]);
    expect(cookieStore.__mocks.set).toHaveBeenCalledWith({
      name: "sb-refresh-token",
      value: "next",
      path: "/"
    });

    cookieStore.__mocks.set.mockClear();

    const readOnlyClientResult = await createSupabaseRequestClient({
      env: TEST_ENV,
      cookieWritePolicy: "read-only",
      cookieProvider: async () => cookieStore,
      createServerClientImpl
    });
    expect(readOnlyClientResult.ok).toBe(true);
    capturedOptions?.cookies.setAll([
      {
        name: "sb-refresh-token",
        value: "next",
        options: { path: "/" }
      }
    ]);
    expect(cookieStore.__mocks.set).not.toHaveBeenCalled();
  });
});
