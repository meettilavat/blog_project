import { describe, expect, it, vi } from "vitest";
import {
  createSupabaseCookieStoreDouble,
  createSupabaseTestEnv
} from "@/tests/support/supabase-testkit";
import { loadSupabaseEnv } from "../bootstrap/env";
import { createSupabaseServerClientOrThrow } from "./next-request-client";
import type {
  ServerClientFactory,
  ServerClientOptions
} from "../contracts/client-boundary";
import { CookieContextUnavailableError } from "../errors/request-client-errors";

const TEST_ENV = createSupabaseTestEnv();

describe("lib/supabase/clients/next-request-client.ts", () => {
  it("creates server client with seam-based dependencies", async () => {
    const cookieStore = createSupabaseCookieStoreDouble([
      { name: "sb-access-token", value: "token" }
    ]);

    let capturedOptions: ServerClientOptions | null = null;
    const createServerClientImpl = vi.fn(
      (url: string, anonKey: string, options: ServerClientOptions) => {
        capturedOptions = options;
        return { url, anonKey };
      }
    ) as ServerClientFactory;

    const client = await createSupabaseServerClientOrThrow({
      env: TEST_ENV,
      cookieProvider: async () => cookieStore,
      createServerClientImpl
    });

    expect(client).toEqual({
      url: TEST_ENV.url,
      anonKey: TEST_ENV.anonKey
    });
    expect(capturedOptions?.cookies.getAll()).toEqual([
      { name: "sb-access-token", value: "token" }
    ]);
  });

  it("throws when cookie context is unavailable in strict request mode", async () => {
    await expect(
      createSupabaseServerClientOrThrow({
        env: TEST_ENV,
        cookieProvider: async () => {
          throw new CookieContextUnavailableError();
        },
        access: "write"
      })
    ).rejects.toThrow("Request cookie context unavailable while creating Supabase server client.");
  });

  it("throws when cookie provider resolves null in strict request mode", async () => {
    await expect(
      createSupabaseServerClientOrThrow({
        env: TEST_ENV,
        cookieProvider: async () => null
      })
    ).rejects.toThrow("Request cookie context unavailable while creating Supabase server client.");
  });

  it("allows missing cookie context only when explicitly enabled", async () => {
    let capturedOptions: ServerClientOptions | null = null;
    const createServerClientImpl = vi.fn(
      (_url: string, _anonKey: string, options: ServerClientOptions) => {
        capturedOptions = options;
        return {};
      }
    ) as ServerClientFactory;

    await createSupabaseServerClientOrThrow({
      env: TEST_ENV,
      cookieProvider: async () => {
        throw new CookieContextUnavailableError();
      },
      cookieContext: "allow-missing",
      createServerClientImpl
    });

    expect(capturedOptions?.cookies.getAll()).toEqual([]);
  });

  it("throws classified cookie access failures for non-context cookie errors", async () => {
    await expect(
      createSupabaseServerClientOrThrow({
        env: TEST_ENV,
        cookieProvider: async () => {
          throw new Error("permission denied");
        }
      })
    ).rejects.toThrow(/Failed to access request cookies: permission denied/);
  });

  it("throws when required Supabase env is missing", () => {
    expect(() =>
      loadSupabaseEnv({
        url: undefined,
        anonKey: undefined
      })
    ).toThrow(/Supabase environment variables are missing/);
  });
});
