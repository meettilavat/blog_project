import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createSupabaseEditorImageUploader,
  toEditorImageUploadError
} from "./editor-image-upload";

const ORIGINAL_WINDOW = globalThis.window;
const ORIGINAL_FETCH = globalThis.fetch;
const HTTPS_PROTOCOL = "https:";
const CDN_ORIGIN = `${HTTPS_PROTOCOL}//cdn.example.com`;

function buildCdnUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalizedPath, `${CDN_ORIGIN}/`).toString().replace(/\/$/, "");
}

function setWindow(value: unknown) {
  Object.defineProperty(globalThis, "window", {
    value,
    configurable: true,
    writable: true
  });
}

describe("lib/services/editor-image-upload.ts", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    setWindow(ORIGINAL_WINDOW);
    globalThis.fetch = ORIGINAL_FETCH;
  });

  it("maps unknown errors to typed upload errors", () => {
    expect(
      toEditorImageUploadError(new Error("boom"), {
        kind: "upload",
        message: "fallback"
      })
    ).toEqual({
      kind: "upload",
      message: "fallback",
      cause: "boom"
    });
  });

  it("returns typed error passthrough when payload is already normalized", () => {
    expect(
      toEditorImageUploadError(
        {
          kind: "upload",
          message: "failed",
          cause: "HTTP 401"
        },
        {
          kind: "upload",
          message: "fallback"
        }
      )
    ).toEqual({
      kind: "upload",
      message: "failed",
      cause: "HTTP 401"
    });
  });

  it("returns client_init error in non-browser runtime", () => {
    setWindow(undefined);
    const state = createSupabaseEditorImageUploader();

    expect(state).toEqual({
      ok: false,
      error: {
        kind: "client_init",
        message: "Image uploader is available only in browser runtime."
      }
    });
  });

  it("uploads image and returns url with measured dimensions when request succeeds", async () => {
    setWindow({});
    const uploadedUrl = buildCdnUrl("/covers/image.png");
    globalThis.fetch = vi.fn(async () =>
      new Response(JSON.stringify({ url: uploadedUrl }), {
        status: 200,
        headers: { "content-type": "application/json" }
      })
    ) as typeof fetch;

    const state = createSupabaseEditorImageUploader();
    expect(state.ok).toBe(true);
    if (!state.ok) {
      return;
    }

    const result = await state.uploadEditorImage(
      new File(["cover"], "cover.png", { type: "image/png" }),
      "covers"
    );

    expect(result).toEqual({
      url: uploadedUrl,
      width: null,
      height: null
    });
  });

  it("throws typed upload error when endpoint returns a failure payload", async () => {
    setWindow({});
    globalThis.fetch = vi.fn(async () =>
      new Response(JSON.stringify({ error: "storage policy denied" }), {
        status: 400,
        headers: { "content-type": "application/json" }
      })
    ) as typeof fetch;

    const state = createSupabaseEditorImageUploader();
    expect(state.ok).toBe(true);
    if (!state.ok) {
      return;
    }

    await expect(
      state.uploadEditorImage(new File(["cover"], "cover.png", { type: "image/png" }), "covers")
    ).rejects.toMatchObject({
      kind: "upload",
      message: "Upload failed. Check authentication and storage policy.",
      cause: "storage policy denied"
    });
  });
});
