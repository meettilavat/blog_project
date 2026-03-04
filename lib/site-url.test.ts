import { afterEach, describe, expect, it, vi } from "vitest";
import { buildHttpsUrl } from "@/lib/config/http-url";
import { getConfiguredSiteUrl } from "./site-url";

const PRIMARY_HOST = "meettilavat.com";
const FALLBACK_HOST = "fallback.example.com";

const PRIMARY_SITE_URL = buildHttpsUrl(PRIMARY_HOST);
const FALLBACK_SITE_URL = buildHttpsUrl(FALLBACK_HOST);

describe("lib/site-url.ts", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns null when no site url env var is set", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("SITE_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");

    expect(getConfiguredSiteUrl()).toBeNull();
  });

  it("uses NEXT_PUBLIC_SITE_URL first and trims trailing slash", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", `${PRIMARY_SITE_URL}/`);
    vi.stubEnv("SITE_URL", FALLBACK_SITE_URL);
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", FALLBACK_HOST);

    expect(getConfiguredSiteUrl()).toBe(PRIMARY_SITE_URL);
  });

  it("adds https protocol for host-only values", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("SITE_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", PRIMARY_HOST);

    expect(getConfiguredSiteUrl()).toBe(PRIMARY_SITE_URL);
  });

  it("returns null for invalid url values", () => {
    const warnSpy = vi.spyOn(process, "emitWarning").mockImplementation(() => undefined);
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "://invalid-url");
    vi.stubEnv("SITE_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");

    expect(getConfiguredSiteUrl()).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(
      "[site-url] Ignoring invalid NEXT_PUBLIC_SITE_URL: invalid URL",
      { code: "SITE_URL_CONFIG" }
    );
  });

  it("falls back to SITE_URL when NEXT_PUBLIC_SITE_URL is invalid", () => {
    const warnSpy = vi.spyOn(process, "emitWarning").mockImplementation(() => undefined);
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "://invalid-url");
    vi.stubEnv("SITE_URL", `${FALLBACK_SITE_URL}/`);
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");

    expect(getConfiguredSiteUrl()).toBe(FALLBACK_SITE_URL);
    expect(warnSpy).toHaveBeenCalledWith(
      "[site-url] Ignoring invalid NEXT_PUBLIC_SITE_URL: invalid URL",
      { code: "SITE_URL_CONFIG" }
    );
  });
});
