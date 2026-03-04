import { afterEach, describe, expect, it, vi } from "vitest";
import { buildHttpsUrl } from "@/lib/config/http-url";
import {
  buildRuntimeUrlPolicy,
  getRuntimeUrlPolicy,
  isManagedSupabaseHost
} from "./runtime-url-policy";

describe("lib/config/runtime-url-policy.ts", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("resolves site url from prioritized env candidates and normalizes host-only values", () => {
    const policy = buildRuntimeUrlPolicy({
      NEXT_PUBLIC_SITE_URL: "",
      SITE_URL: "",
      VERCEL_PROJECT_PRODUCTION_URL: "meettilavat.com"
    });

    expect(policy.siteUrl).toBe(buildHttpsUrl("meettilavat.com"));
  });

  it("adds site and Supabase hosts to allowed image host set", () => {
    const policy = buildRuntimeUrlPolicy({
      NEXT_PUBLIC_SITE_URL: buildHttpsUrl("meettilavat.com"),
      SITE_URL: "",
      VERCEL_PROJECT_PRODUCTION_URL: "",
      NEXT_PUBLIC_SUPABASE_URL: buildHttpsUrl("project-id.supabase.co")
    });

    expect(policy.allowedImageHosts.has("meettilavat.com")).toBe(true);
    expect(policy.allowedImageHosts.has("project-id.supabase.co")).toBe(true);
  });

  it("reports warnings through injected callback for invalid site and supabase url inputs", () => {
    const warnings: Array<{ code: string; message: string }> = [];
    const policy = buildRuntimeUrlPolicy(
      {
        NEXT_PUBLIC_SITE_URL: "://broken-site",
        SITE_URL: "",
        VERCEL_PROJECT_PRODUCTION_URL: "",
        NEXT_PUBLIC_SUPABASE_URL: "://broken-supabase"
      },
      (warning) => {
        warnings.push({
          code: warning.code,
          message: warning.message
        });
      }
    );

    expect(policy.siteUrl).toBeNull();
    expect(policy.supabaseUrl).toBeNull();
    expect(warnings).toEqual([
      {
        code: "SITE_URL_CONFIG",
        message: "[site-url] Ignoring invalid NEXT_PUBLIC_SITE_URL: invalid URL"
      },
      {
        code: "SUPABASE_URL_CONFIG",
        message: "[image-host-policy] Ignoring invalid NEXT_PUBLIC_SUPABASE_URL: invalid URL"
      }
    ]);
  });

  it("runtime wrapper emits process warnings for invalid env values", () => {
    const warnSpy = vi.spyOn(process, "emitWarning").mockImplementation(() => undefined);
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "://broken-site");
    vi.stubEnv("SITE_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "://broken-supabase");

    const policy = getRuntimeUrlPolicy();

    expect(policy.siteUrl).toBeNull();
    expect(policy.supabaseUrl).toBeNull();
    expect(warnSpy).toHaveBeenCalledTimes(2);
  });

  it("re-evaluates policy on each call when env values change", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", buildHttpsUrl("initial.example"));
    const initial = getRuntimeUrlPolicy();

    vi.stubEnv("NEXT_PUBLIC_SITE_URL", buildHttpsUrl("next.example"));
    const refreshed = getRuntimeUrlPolicy();
    expect(refreshed.siteUrl).toBe(buildHttpsUrl("next.example"));
    expect(refreshed).not.toBe(initial);
  });

  it("recognizes managed Supabase host suffixes", () => {
    expect(isManagedSupabaseHost("abc.supabase.co")).toBe(true);
    expect(isManagedSupabaseHost("abc.supabase.in")).toBe(true);
    expect(isManagedSupabaseHost("example.com")).toBe(false);
  });
});
