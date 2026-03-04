import { describe, expect, it, vi } from "vitest";
import { createSupabaseTestEnv } from "@/tests/support/supabase-testkit";
import {
  createSupabasePublicServerClient,
  type PublicClientFactory,
  type PublicClientOptions
} from "./public-client";

const TEST_ENV = createSupabaseTestEnv();

describe("lib/supabase/clients/public-client.ts", () => {
  it("creates public client through seam factory with expected auth options", () => {
    const createClientImpl = vi.fn(
      (url: string, anonKey: string, options: PublicClientOptions) => ({
        url,
        anonKey,
        options
      })
    ) as PublicClientFactory;

    const client = createSupabasePublicServerClient({
      env: TEST_ENV,
      createClientImpl
    });

    expect(client).toMatchObject({
      url: TEST_ENV.url,
      anonKey: TEST_ENV.anonKey
    });
    expect(createClientImpl).toHaveBeenCalledWith(
      TEST_ENV.url,
      TEST_ENV.anonKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      }
    );
  });
});
