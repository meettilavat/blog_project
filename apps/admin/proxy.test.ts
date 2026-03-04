import { afterEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import proxy, { config } from "./proxy";

const HTTPS_PROTOCOL = "https";
const SUPABASE_HOST = "project.supabase.co";
const SUPABASE_URL = `${HTTPS_PROTOCOL}://${SUPABASE_HOST}`;

function makeRequest(pathname: string, token?: string): NextRequest {
  const base = new URL(`https://example.com${pathname}`);
  const nextUrl = Object.assign(base, {
    clone: () => new URL(base.toString())
  });

  return {
    nextUrl,
    cookies: {
      get: () => (token ? { value: token } : undefined)
    }
  } as unknown as NextRequest;
}

describe("apps/admin/proxy.ts", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("allows public paths without authentication redirects", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", SUPABASE_URL);

    const response = proxy(makeRequest("/login"));

    expect(response.headers.get("location")).toBeNull();
  });

  it("redirects protected paths to login when auth cookie is missing", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", SUPABASE_URL);

    const response = proxy(makeRequest("/dashboard"));

    expect(response.headers.get("location")).toContain("/login");
  });

  it("keeps proxy matcher configuration aligned with protected route policy", () => {
    expect(config.matcher).toEqual(["/((?!_next/static|_next/image|favicon.ico).*)"]);
  });
});
