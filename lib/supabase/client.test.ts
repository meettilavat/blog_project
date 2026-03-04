import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createBrowserClientMock } = vi.hoisted(() => ({
  createBrowserClientMock: vi.fn()
}));

vi.mock("@supabase/ssr", () => ({
  createBrowserClient: createBrowserClientMock
}));

import { createSupabaseBrowserClient } from "./client";

const HTTPS_PROTOCOL = "https";
const SUPABASE_HOST = "example.supabase.co";
const SUPABASE_URL = `${HTTPS_PROTOCOL}://${SUPABASE_HOST}`;

describe("lib/supabase/client.ts", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("throws when required browser client env vars are missing", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");

    expect(() => createSupabaseBrowserClient()).toThrow(
      "Supabase environment variables are missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  });

  it("creates browser client with configured URL and anon key", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", SUPABASE_URL);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
    createBrowserClientMock.mockReturnValue({ client: true });

    const client = createSupabaseBrowserClient();

    expect(createBrowserClientMock).toHaveBeenCalledWith(SUPABASE_URL, "anon-key");
    expect(client).toEqual({ client: true });
  });
});
