import { describe, expect, it } from "vitest";
import { buildHttpsUrl } from "@/lib/config/http-url";
import { buildRuntimeUrlPolicy } from "@/lib/config/runtime-url-policy";
import {
  isAllowedImageHost,
  isAllowedImageSource,
  isImageMimeType,
  isSvgImageMimeType
} from "./image-host-policy";
import { createImageHostPolicyFromRuntimeUrlPolicy } from "./runtime-image-host-policy";

const BASE_IMAGE_HOST_POLICY = createImageHostPolicyFromRuntimeUrlPolicy(
  buildRuntimeUrlPolicy({
    NEXT_PUBLIC_SITE_URL: "",
    SITE_URL: "",
    VERCEL_PROJECT_PRODUCTION_URL: "",
    NEXT_PUBLIC_SUPABASE_URL: ""
  })
);

const SUPABASE_AWARE_IMAGE_HOST_POLICY = createImageHostPolicyFromRuntimeUrlPolicy(
  buildRuntimeUrlPolicy({
    NEXT_PUBLIC_SITE_URL: "",
    SITE_URL: "",
    VERCEL_PROJECT_PRODUCTION_URL: "",
    NEXT_PUBLIC_SUPABASE_URL: buildHttpsUrl("project-id.supabase.co")
  })
);

describe("lib/content/image-host-policy.ts", () => {
  it("allows known image CDN hosts", () => {
    expect(
      isAllowedImageHost(buildHttpsUrl("images.unsplash.com", "/photo-1"), BASE_IMAGE_HOST_POLICY)
    ).toBe(true);
    expect(
      isAllowedImageHost(buildHttpsUrl("images.pexels.com", "/photo-2"), BASE_IMAGE_HOST_POLICY)
    ).toBe(true);
  });

  it("rejects malformed and unknown hosts", () => {
    expect(isAllowedImageHost("not-a-url", BASE_IMAGE_HOST_POLICY)).toBe(false);
    expect(
      isAllowedImageHost(buildHttpsUrl("unknown.example.com", "/photo"), BASE_IMAGE_HOST_POLICY)
    ).toBe(false);
  });

  it("allows managed Supabase hosts through explicit policy callbacks", () => {
    expect(
      isAllowedImageHost(
        buildHttpsUrl("project-id.supabase.co", "/storage/v1/object/public/image.png"),
        SUPABASE_AWARE_IMAGE_HOST_POLICY
      )
    ).toBe(true);
  });

  it("applies shared source policy for relative, data, and remote urls", () => {
    expect(isAllowedImageSource("/images/cover.png", BASE_IMAGE_HOST_POLICY)).toBe(true);
    expect(isAllowedImageSource("//evil.example/x.png", BASE_IMAGE_HOST_POLICY)).toBe(false);
    expect(isAllowedImageSource("data:image/png;base64,abc", BASE_IMAGE_HOST_POLICY)).toBe(true);
    expect(isAllowedImageSource("data:image/svg+xml;base64,abc", BASE_IMAGE_HOST_POLICY)).toBe(false);
    expect(
      isAllowedImageSource(buildHttpsUrl("images.unsplash.com", "/photo"), BASE_IMAGE_HOST_POLICY)
    ).toBe(true);
    expect(
      isAllowedImageSource(buildHttpsUrl("unknown.example.com", "/photo"), BASE_IMAGE_HOST_POLICY)
    ).toBe(false);
  });

  it("classifies image mime types and blocks svg uploads", () => {
    expect(isImageMimeType("image/png")).toBe(true);
    expect(isImageMimeType("text/plain")).toBe(false);
    expect(isSvgImageMimeType("image/svg+xml")).toBe(true);
    expect(isSvgImageMimeType("image/png")).toBe(false);
  });
});
