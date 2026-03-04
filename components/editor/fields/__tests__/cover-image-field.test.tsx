import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const { useCoverImageUploadMock } = vi.hoisted(() => ({
  useCoverImageUploadMock: vi.fn(() => ({
    canUpload: true,
    isUploading: false,
    error: null,
    uploadCoverImage: vi.fn(),
    clearError: vi.fn()
  }))
}));

vi.mock("@/components/editor/use-cover-image-upload", () => ({
  useCoverImageUpload: useCoverImageUploadMock
}));

import CoverImageField from "../cover-image-field";

describe("components/editor/fields/cover-image-field.tsx", () => {
  it("renders empty-state affordances when no cover URL is provided", () => {
    const html = renderToStaticMarkup(<CoverImageField value="" onChange={() => undefined} />);

    expect(html).toContain("Add a cover image");
    expect(html).toContain("Paste a cover image URL");
    expect(html).toContain("Upload");
  });
});
