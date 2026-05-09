import { describe, expect, it } from "vitest";
import { buildHttpsUrl } from "@/lib/config/http-url";
import type { ImageHostPolicy } from "@/lib/content/image-host-policy";
import { resolveImageRenderProps } from "./image-render-props";

const BASE_IMAGE_HOST_POLICY: ImageHostPolicy = {
  allowedImageHosts: new Set(["allowed.example"])
};

describe("lib/content/rich-text/image-render-props.ts", () => {
  it("resolves allowed remote images with parsed dimensions and caption fallback alt", () => {
    const result = resolveImageRenderProps(
      {
        type: "image",
        attrs: {
          src: buildHttpsUrl("allowed.example", "/cover.png"),
          caption: " Cover caption ",
          width: "640",
          height: "360"
        }
      },
      BASE_IMAGE_HOST_POLICY
    );

    expect(result).toEqual({
      src: buildHttpsUrl("allowed.example", "/cover.png"),
      alt: "Cover caption",
      caption: "Cover caption",
      width: 640,
      height: 360,
      unoptimized: false,
      layout: "center",
      align: "right"
    });
  });

  it("marks local image paths as optimizable and uses explicit alt text", () => {
    const result = resolveImageRenderProps(
      {
        type: "image",
        attrs: {
          src: "/images/cover.png",
          alt: "Cover alt"
        }
      },
      BASE_IMAGE_HOST_POLICY
    );

    expect(result).toMatchObject({
      src: "/images/cover.png",
      alt: "Cover alt",
      caption: "",
      unoptimized: false,
      layout: "center",
      align: "right"
    });
    expect(result?.width).toBe(1200);
    expect(result?.height).toBe(800);
  });

  it("marks data image urls as unoptimized", () => {
    const result = resolveImageRenderProps(
      {
        type: "image",
        attrs: {
          src: "data:image/png;base64,abc123"
        }
      },
      BASE_IMAGE_HOST_POLICY
    );

    expect(result).toMatchObject({
      src: "data:image/png;base64,abc123",
      alt: "Embedded image",
      unoptimized: true,
      layout: "center",
      align: "right"
    });
  });

  it("resolves supported figure layout attributes", () => {
    const result = resolveImageRenderProps(
      {
        type: "image",
        attrs: {
          src: "/images/phone.png",
          layout: "side",
          align: "left"
        }
      },
      BASE_IMAGE_HOST_POLICY
    );

    expect(result).toMatchObject({
      layout: "side",
      align: "left"
    });
  });

  it("returns null for blocked remote hosts and disallowed mime types", () => {
    const blockedHost = resolveImageRenderProps(
      {
        type: "image",
        attrs: {
          src: buildHttpsUrl("blocked.example", "/cover.png")
        }
      },
      BASE_IMAGE_HOST_POLICY
    );
    const blockedMime = resolveImageRenderProps(
      {
        type: "image",
        attrs: {
          src: "data:image/svg+xml;base64,abc123"
        }
      },
      BASE_IMAGE_HOST_POLICY
    );

    expect(blockedHost).toBeNull();
    expect(blockedMime).toBeNull();
  });
});
