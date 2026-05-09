import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { Editor } from "@tiptap/react";
import { useEditorImageInsertion } from "./use-editor-image-insertion";

const HTTPS_PROTOCOL = "https://";
const UPLOADED_IMAGE_URL = [HTTPS_PROTOCOL, "images.example.com", "/cover.png"].join("");

let hookResult: ReturnType<typeof useEditorImageInsertion> | null = null;

function EditorImageInsertionHarness({
  editor,
  uploadInlineImage
}: {
  editor: Editor | null;
  uploadInlineImage: (file: File) => Promise<
    | { ok: true; image: { url: string; width: number | null; height: number | null } }
    | { ok: false; message: string }
  >;
}) {
  // eslint-disable-next-line react-hooks/globals -- test harness captures hook output for direct callback assertions.
  hookResult = useEditorImageInsertion({
    editor,
    uploadInlineImage
  });
  return <div>EditorImageInsertionHarness</div>;
}

describe("components/editor/use-editor-image-insertion.ts", () => {
  beforeEach(() => {
    hookResult = null;
    vi.stubGlobal("alert", vi.fn());
    vi.stubGlobal("window", { prompt: vi.fn(() => "Figure caption") });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("triggers the hidden file input when triggerImageUpload is called", () => {
    const uploadInlineImage = vi.fn();
    renderToStaticMarkup(
      <EditorImageInsertionHarness editor={null} uploadInlineImage={uploadInlineImage} />
    );

    const clickMock = vi.fn();
    if (!hookResult) {
      throw new Error("hookResult was not initialized");
    }
    hookResult.fileInputRef.current = { click: clickMock } as unknown as HTMLInputElement;

    hookResult.triggerImageUpload();

    expect(clickMock).toHaveBeenCalledTimes(1);
  });

  it("uploads and inserts dropped image files", async () => {
    const runMock = vi.fn();
    const insertContentMock = vi.fn(() => ({ run: runMock }));
    const focusMock = vi.fn(() => ({ insertContent: insertContentMock }));
    const chainMock = vi.fn(() => ({ focus: focusMock }));
    const editor = { chain: chainMock } as unknown as Editor;
    const uploadInlineImage = vi.fn().mockResolvedValue({
      ok: true,
      image: {
        url: UPLOADED_IMAGE_URL,
        width: 640,
        height: 360
      }
    });

    renderToStaticMarkup(
      <EditorImageInsertionHarness editor={editor} uploadInlineImage={uploadInlineImage} />
    );

    if (!hookResult) {
      throw new Error("hookResult was not initialized");
    }

    const preventDefault = vi.fn();
    const file = new File(["image-bytes"], "cover.png", { type: "image/png" });
    await hookResult.handleDrop({
      preventDefault,
      dataTransfer: { files: [file] }
    } as unknown as React.DragEvent<HTMLDivElement>);

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(uploadInlineImage).toHaveBeenCalledWith(file);
    expect(insertContentMock).toHaveBeenCalledWith({
      type: "image",
      attrs: {
        src: UPLOADED_IMAGE_URL,
        alt: "cover.png",
        caption: "Figure caption",
        width: 640,
        height: 360
      }
    });
    expect(runMock).toHaveBeenCalledTimes(1);
  });

  it("alerts users when upload fails and skips insertion", async () => {
    const runMock = vi.fn();
    const insertContentMock = vi.fn(() => ({ run: runMock }));
    const focusMock = vi.fn(() => ({ insertContent: insertContentMock }));
    const chainMock = vi.fn(() => ({ focus: focusMock }));
    const editor = { chain: chainMock } as unknown as Editor;
    const uploadInlineImage = vi.fn().mockResolvedValue({
      ok: false,
      message: "Upload failed"
    });

    renderToStaticMarkup(
      <EditorImageInsertionHarness editor={editor} uploadInlineImage={uploadInlineImage} />
    );

    if (!hookResult) {
      throw new Error("hookResult was not initialized");
    }

    const file = new File(["bad"], "bad.png", { type: "image/png" });
    await hookResult.handleFileChange(file);

    expect(uploadInlineImage).toHaveBeenCalledWith(file);
    expect(alert).toHaveBeenCalledWith("Upload failed");
    expect(insertContentMock).not.toHaveBeenCalled();
    expect(runMock).not.toHaveBeenCalled();
  });
});
