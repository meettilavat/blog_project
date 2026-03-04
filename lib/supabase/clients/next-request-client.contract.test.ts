import { describe, expect, it } from "vitest";
import {
  createSupabaseCookieStoreDouble,
  createSupabaseTestEnv
} from "@/tests/support/supabase-testkit";
import { createServerClientCaptureHarness } from "@/tests/support/supabase-contract-harness";
import { createSupabaseServerClient } from "./next-request-client";
import { CookieContextUnavailableError } from "../errors/request-client-errors";

const TEST_ENV = createSupabaseTestEnv();

describe("lib/supabase/clients/next-request-client.ts adapter contract", () => {
  it("maps strict cookie-context failures to cookies_unavailable boundary errors", async () => {
    const result = await createSupabaseServerClient({
      env: TEST_ENV,
      cookieContext: "strict",
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

  it("adapts allow-missing cookie-context mode to an empty-cookie client", async () => {
    const harness = createServerClientCaptureHarness();

    const result = await createSupabaseServerClient({
      env: TEST_ENV,
      access: "read",
      cookieContext: "allow-missing",
      cookieProvider: async () => {
        throw new CookieContextUnavailableError();
      },
      createServerClientImpl: harness.createServerClientImpl
    });

    expect(result).toEqual({
      ok: true,
      data: {}
    });
    expect(harness.readCookies()).toEqual([]);
  });

  it("maps write access mode to writable cookie mutation behavior", async () => {
    const cookieStore = createSupabaseCookieStoreDouble();
    const harness = createServerClientCaptureHarness();

    const result = await createSupabaseServerClient({
      env: TEST_ENV,
      access: "write",
      cookieProvider: async () => cookieStore,
      createServerClientImpl: harness.createServerClientImpl
    });

    expect(result.ok).toBe(true);

    harness.writeCookies([
      {
        name: "sb-refresh-token",
        value: "next",
        options: { path: "/" }
      }
    ]);

    expect(cookieStore.__mocks.set).toHaveBeenCalledTimes(1);
  });
});
