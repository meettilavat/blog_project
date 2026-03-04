import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const { quickInsertMock } = vi.hoisted(() => ({
  quickInsertMock: vi.fn(({ commands }: { commands: unknown[] }) => (
    <div>{`QuickInsertStub:${commands.length}`}</div>
  ))
}));

vi.mock("@/components/editor/quick-insert", () => ({
  QuickInsert: (props: { commands: unknown[] }) => quickInsertMock(props)
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    variant,
    disabled,
    className,
    type
  }: {
    children: React.ReactNode;
    variant?: string;
    disabled?: boolean;
    className?: string;
    type?: "button" | "submit";
  }) => (
    <button
      type={type}
      className={className}
      disabled={disabled}
      data-variant={variant}
    >
      {children}
    </button>
  )
}));

import { EditorToolbar } from "./editor-toolbar";

const IconStub = ({ className }: { className?: string }) => <svg className={className} />;

describe("components/editor/editor-toolbar.tsx", () => {
  it("renders toolbar commands, file input, and quick insert", () => {
    const html = renderToStaticMarkup(
      <EditorToolbar
        toolbarCommands={[
          {
            id: "bold",
            label: "Bold",
            icon: IconStub,
            surfaces: ["toolbar"],
            run: () => undefined,
            isActive: true
          },
          {
            id: "italic",
            label: "Italic",
            icon: IconStub,
            surfaces: ["toolbar"],
            run: () => undefined,
            disabled: true
          }
        ]}
        quickInsertCommands={[
          {
            id: "heading",
            label: "Heading",
            icon: IconStub,
            surfaces: ["quick-insert"],
            run: () => undefined
          }
        ]}
        fileInputRef={createRef<HTMLInputElement>()}
        onFileChange={() => undefined}
        uploading={false}
        uploadProgress={0}
      />
    );

    expect(html).toContain(">Bold<");
    expect(html).toContain(">Italic<");
    expect(html).toContain("data-variant=\"default\"");
    expect(html).toContain("data-variant=\"ghost\"");
    expect(html).toContain("type=\"file\"");
    expect(html).toContain("accept=\"image/*\"");
    expect(html).toContain("QuickInsertStub:1");
    expect(html).not.toContain("Uploading image...");
  });

  it("shows upload progress while image upload is running", () => {
    const html = renderToStaticMarkup(
      <EditorToolbar
        toolbarCommands={[
          {
            id: "image",
            label: "Image",
            icon: IconStub,
            surfaces: ["toolbar"],
            run: () => undefined
          }
        ]}
        quickInsertCommands={[]}
        fileInputRef={createRef<HTMLInputElement>()}
        onFileChange={() => undefined}
        uploading
        uploadProgress={73}
      />
    );

    expect(html).toContain("Uploading image... 73%");
  });
});
