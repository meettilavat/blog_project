import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/lib/services/editor-image-upload", () => ({
  createSupabaseEditorImageUploader: () => ({
    ok: false,
    error: {
      kind: "misconfigured",
      message: "Missing upload endpoint configuration."
    }
  }),
  toEditorImageUploadError: vi.fn()
}));

import { useCoverImageUpload } from "./use-cover-image-upload";

describe("components/editor/use-cover-image-upload.ts", () => {
  it("surfaces uploader availability state from service configuration", () => {
    function HookProbe() {
      const { canUpload, error } = useCoverImageUpload();
      return createElement(
        "span",
        null,
        `${canUpload ? "enabled" : "disabled"}:${error?.kind ?? ""}`
      );
    }

    const html = renderToStaticMarkup(createElement(HookProbe));

    expect(html).toContain("disabled:misconfigured");
  });
});
