import { afterEach, describe, expect, it, vi } from "vitest";
import { buildHttpsUrl } from "@/lib/config/http-url";
import { buildRuntimeUrlPolicy } from "@/lib/config/runtime-url-policy";
import {
  createImageHostPolicyFromRuntimeUrlPolicy,
  getRuntimeImageHostPolicy
} from "./runtime-image-host-policy";

describe("lib/content/runtime-image-host-policy.ts", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("builds image-host policy from runtime-url-policy shape via canonical constructor", () => {
    const policy = createImageHostPolicyFromRuntimeUrlPolicy(
      buildRuntimeUrlPolicy({
        NEXT_PUBLIC_SITE_URL: buildHttpsUrl("blog.example.com"),
        SITE_URL: "",
        VERCEL_PROJECT_PRODUCTION_URL: "",
        NEXT_PUBLIC_SUPABASE_URL: buildHttpsUrl("project-id.supabase.co")
      })
    );

    expect(policy.allowedImageHosts.has("images.unsplash.com")).toBe(true);
    expect(policy.allowedImageHosts.has("blog.example.com")).toBe(true);
    expect(policy.allowedImageHosts.has("project-id.supabase.co")).toBe(true);
  });

  it("exposes managed-host classification from runtime policy", () => {
    const policy = createImageHostPolicyFromRuntimeUrlPolicy(
      buildRuntimeUrlPolicy({
        NEXT_PUBLIC_SITE_URL: "",
        SITE_URL: "",
        VERCEL_PROJECT_PRODUCTION_URL: "",
        NEXT_PUBLIC_SUPABASE_URL: ""
      })
    );

    expect(policy.isManagedHost?.("project-id.supabase.co")).toBe(true);
    expect(policy.isManagedHost?.("project-id.supabase.in")).toBe(true);
    expect(policy.isManagedHost?.("cdn.example.com")).toBe(false);
  });

  it("runtime helper reuses canonical constructor against process env policy", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", buildHttpsUrl("blog.example.com"));
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", buildHttpsUrl("project-id.supabase.co"));

    const policy = getRuntimeImageHostPolicy();
    expect(policy.allowedImageHosts.has("blog.example.com")).toBe(true);
    expect(policy.allowedImageHosts.has("project-id.supabase.co")).toBe(true);
    expect(policy.isManagedHost?.("project-id.supabase.co")).toBe(true);
  });
});
