import { afterEach, describe, expect, it, vi } from "vitest";
import nextConfig from "./next.config.mjs";

describe("next.config.mjs", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("does not define app-level redirects when Vercel owns host forwarding", async () => {
    expect(nextConfig.redirects).toBeUndefined();
  });

  it("hides framework metadata and limits executable CSP sources", async () => {
    vi.stubEnv("NODE_ENV", "production");

    expect(nextConfig.poweredByHeader).toBe(false);
    const configuredHeaders = await nextConfig.headers?.();
    const contentSecurityPolicy = configuredHeaders?.[0]?.headers.find(
      (header) => header.key === "Content-Security-Policy"
    )?.value;

    expect(contentSecurityPolicy).toContain("script-src 'self' 'unsafe-inline'");
    expect(contentSecurityPolicy).toContain("style-src 'self' 'unsafe-inline'");
    expect(contentSecurityPolicy).not.toContain("script-src 'self' 'unsafe-inline' https:");
    expect(contentSecurityPolicy).not.toContain("style-src 'self' 'unsafe-inline' https:");
    expect(contentSecurityPolicy).not.toContain("font-src 'self' data: https:");
  });
});
