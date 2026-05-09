import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { buildHttpsUrl } from "@/lib/config/http-url";
import type { ImageHostPolicy } from "@/lib/content/image-host-policy";
import { renderImageNode } from "./rich-text-image-renderer";

const HTTPS_PROTOCOL = "https://";
const ALLOWED_IMAGE_URL = [HTTPS_PROTOCOL, "allowed.example", "/cover.png"].join("");
const BLOCKED_IMAGE_URL = buildHttpsUrl("blocked.example", "/cover.png");
const DATA_IMAGE_URL = "data:image/png;base64,abc123";
const IMAGE_HOST_POLICY: ImageHostPolicy = {
  allowedImageHosts: new Set(["allowed.example"])
};

const resolveImageRenderPropsMock = vi.hoisted(() => vi.fn());

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    width,
    height,
    unoptimized
  }: {
    src: string;
    alt: string;
    width: number;
    height: number;
    unoptimized?: boolean;
  }) => (
    <img
      data-next-image
      src={src}
      alt={alt}
      width={String(width)}
      height={String(height)}
      data-unoptimized={String(Boolean(unoptimized))}
    />
  )
}));

vi.mock("@/lib/content/rich-text/image-render-props", () => ({
  resolveImageRenderProps: (node: unknown, imageHostPolicy: unknown) =>
    resolveImageRenderPropsMock(node, imageHostPolicy)
}));

describe("components/content/rich-text-image-renderer.tsx", () => {
  beforeEach(() => {
    resolveImageRenderPropsMock.mockReset();
  });

  it("renders optimized remote images with caption fallback alt text", () => {
    const node = {
      type: "image",
      attrs: {
        src: ALLOWED_IMAGE_URL,
        caption: "Cover caption",
        width: "640",
        height: "360"
      }
    } as const;
    resolveImageRenderPropsMock.mockReturnValue({
      src: ALLOWED_IMAGE_URL,
      alt: "Cover caption",
      caption: "Cover caption",
      width: 640,
      height: 360,
      unoptimized: false,
      layout: "center",
      align: "right"
    });

    const html = renderToStaticMarkup(
      <>{renderImageNode(node, "image-1", IMAGE_HOST_POLICY)}</>
    );

    expect(html).toContain(`src="${ALLOWED_IMAGE_URL}"`);
    expect(html).toContain("alt=\"Cover caption\"");
    expect(html).toContain("data-unoptimized=\"false\"");
    expect(html).toContain("<figcaption>Cover caption</figcaption>");
    expect(resolveImageRenderPropsMock).toHaveBeenCalledWith(node, IMAGE_HOST_POLICY);
  });

  it("renders data urls as unoptimized with default dimensions", () => {
    resolveImageRenderPropsMock.mockReturnValue({
      src: DATA_IMAGE_URL,
      alt: "Embedded image",
      caption: "",
      width: 1200,
      height: 800,
      unoptimized: true,
      layout: "center",
      align: "right"
    });

    const html = renderToStaticMarkup(
      <>{renderImageNode(
        {
          type: "image",
          attrs: {
            src: DATA_IMAGE_URL
          }
        },
        "image-2",
        IMAGE_HOST_POLICY
      )}</>
    );

    expect(html).toContain("data-unoptimized=\"true\"");
    expect(html).toContain("width=\"1200\"");
    expect(html).toContain("height=\"800\"");
  });

  it("renders side figures with layout and alignment classes", () => {
    resolveImageRenderPropsMock.mockReturnValue({
      src: ALLOWED_IMAGE_URL,
      alt: "Phone screenshot",
      caption: "Phone caption",
      width: 1080,
      height: 2400,
      unoptimized: false,
      layout: "side",
      align: "left"
    });

    const html = renderToStaticMarkup(
      <>{renderImageNode(
        {
          type: "image",
          attrs: {
            src: ALLOWED_IMAGE_URL
          }
        },
        "image-side",
        IMAGE_HOST_POLICY
      )}</>
    );

    expect(html).toContain("tiptap-figure-side");
    expect(html).toContain("tiptap-figure-side-left");
    expect(html).toContain("data-layout=\"side\"");
    expect(html).toContain("data-align=\"left\"");
  });

  it("skips rendering disallowed image sources", () => {
    resolveImageRenderPropsMock.mockReturnValue(null);

    const html = renderToStaticMarkup(
      <>{renderImageNode(
        {
          type: "image",
          attrs: {
            src: BLOCKED_IMAGE_URL
          }
        },
        "image-3",
        IMAGE_HOST_POLICY
      )}</>
    );

    expect(html).toBe("");
  });
});
