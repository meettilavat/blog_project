import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn()
  })
}));

vi.mock("next/dynamic", () => ({
  default: () => function RichEditorStub() {
    return <div>RichEditorStub</div>;
  }
}));

vi.mock("@/components/editor/fields/cover-image-field", () => ({
  default: function CoverImageFieldStub() {
    return <div>CoverImageFieldStub</div>;
  }
}));

vi.mock("@/apps/admin/features/editor/server/post-actions", () => ({
  savePostAction: vi.fn()
}));

import { EditorForm } from "./editor-form";

describe("apps/admin/features/editor/ui/editor-form.tsx", () => {
  it("renders editor shell with draft sidebar content", () => {
    const html = renderToStaticMarkup(
      <EditorForm
        drafts={[
          {
            id: "draft-1",
            title: "Draft title",
            slug: "draft-title",
            updatedAt: "2024-01-01T00:00:00.000Z"
          }
        ]}
      />
    );

    expect(html).toContain("New entry");
    expect(html).toContain("Recent drafts");
    expect(html).toContain("Draft title");
    expect(html).toContain("RichEditorStub");
    expect(html).toContain("CoverImageFieldStub");
  });
});
