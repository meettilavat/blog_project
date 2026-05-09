import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { useInlineImageUpload } from "./use-inline-image-upload";

const HTTPS_PROTOCOL = "https://";
const UPLOADED_INLINE_IMAGE_URL = [HTTPS_PROTOCOL, "images.example.com", "/inline.png"].join("");

const mocks = vi.hoisted(() => ({
  createSupabaseEditorImageUploaderMock: vi.fn(),
  toEditorImageUploadErrorMock: vi.fn()
}));

vi.mock("@/lib/services/editor-image-upload", () => ({
  createSupabaseEditorImageUploader: () => mocks.createSupabaseEditorImageUploaderMock(),
  toEditorImageUploadError: (error: unknown, fallback: unknown) =>
    mocks.toEditorImageUploadErrorMock(error, fallback)
}));

let hookResult: ReturnType<typeof useInlineImageUpload> | null = null;

function InlineImageUploadHarness() {
  // eslint-disable-next-line react-hooks/globals -- test harness captures hook output for direct upload assertions.
  hookResult = useInlineImageUpload();
  return <div>{`uploadsEnabled:${String(hookResult.uploadsEnabled)}`}</div>;
}

describe("components/editor/use-inline-image-upload.ts", () => {
  beforeEach(() => {
    hookResult = null;
    mocks.createSupabaseEditorImageUploaderMock.mockReset();
    mocks.toEditorImageUploadErrorMock.mockReset();
  });

  it("returns uploader-state errors when uploads are disabled", async () => {
    mocks.createSupabaseEditorImageUploaderMock.mockReturnValue({
      ok: false,
      error: {
        message: "Supabase is not configured.",
        cause: "NEXT_PUBLIC_SUPABASE_URL missing"
      }
    });

    const html = renderToStaticMarkup(<InlineImageUploadHarness />);
    const file = new File(["png-data"], "image.png", { type: "image/png" });
    if (!hookResult) {
      throw new Error("hookResult was not initialized");
    }
    const result = await hookResult.uploadInlineImage(file);

    expect(html).toContain("uploadsEnabled:false");
    expect(result).toEqual({
      ok: false,
      message: "Supabase is not configured. (NEXT_PUBLIC_SUPABASE_URL missing)"
    });
  });

  it("uploads inline images successfully when uploader is available", async () => {
    const uploadEditorImage = vi.fn().mockResolvedValue({
      url: UPLOADED_INLINE_IMAGE_URL,
      width: 640,
      height: 480
    });
    mocks.createSupabaseEditorImageUploaderMock.mockReturnValue({
      ok: true,
      uploadEditorImage
    });

    const html = renderToStaticMarkup(<InlineImageUploadHarness />);
    const file = new File(["png-data"], "inline.png", { type: "image/png" });
    if (!hookResult) {
      throw new Error("hookResult was not initialized");
    }
    const result = await hookResult.uploadInlineImage(file);

    expect(html).toContain("uploadsEnabled:true");
    expect(uploadEditorImage).toHaveBeenCalledWith(file, "inline");
    expect(result).toEqual({
      ok: true,
      image: {
        url: UPLOADED_INLINE_IMAGE_URL,
        width: 640,
        height: 480
      }
    });
  });

  it("maps upload exceptions through toEditorImageUploadError", async () => {
    const uploadEditorImage = vi.fn().mockRejectedValue(new Error("raw upload failure"));
    mocks.createSupabaseEditorImageUploaderMock.mockReturnValue({
      ok: true,
      uploadEditorImage
    });
    mocks.toEditorImageUploadErrorMock.mockReturnValue({
      kind: "upload",
      message: "Upload failed. Check storage policy.",
      cause: "Storage bucket policy denied insert"
    });

    renderToStaticMarkup(<InlineImageUploadHarness />);
    const file = new File(["png-data"], "inline.png", { type: "image/png" });
    if (!hookResult) {
      throw new Error("hookResult was not initialized");
    }
    const result = await hookResult.uploadInlineImage(file);

    expect(mocks.toEditorImageUploadErrorMock).toHaveBeenCalled();
    expect(result).toEqual({
      ok: false,
      message: "Upload failed. Check storage policy. (Storage bucket policy denied insert)"
    });
  });
});
