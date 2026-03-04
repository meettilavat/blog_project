import { createRef } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { EditorCommand } from "@/components/editor/commands";

const mocks = vi.hoisted(() => ({
  useInlineImageUploadMock: vi.fn(),
  useRichEditorInstanceMock: vi.fn(),
  useEditorImageInsertionMock: vi.fn(),
  useEditorCommandsMock: vi.fn(),
  editorToolbarMock: vi.fn(),
  editorContentMock: vi.fn()
}));

vi.mock("@/components/editor/use-inline-image-upload", () => ({
  useInlineImageUpload: () => mocks.useInlineImageUploadMock()
}));

vi.mock("@/components/editor/use-rich-editor-instance", () => ({
  useRichEditorInstance: (args: unknown) => mocks.useRichEditorInstanceMock(args)
}));

vi.mock("@/components/editor/use-editor-image-insertion", () => ({
  useEditorImageInsertion: (args: unknown) => mocks.useEditorImageInsertionMock(args)
}));

vi.mock("@/components/editor/use-editor-commands", () => ({
  useEditorCommands: (args: unknown) => mocks.useEditorCommandsMock(args)
}));

vi.mock("@/components/editor/editor-toolbar", () => ({
  EditorToolbar: (props: { toolbarCommands: unknown[]; quickInsertCommands: unknown[] }) =>
    mocks.editorToolbarMock(props)
}));

vi.mock("@tiptap/react", () => ({
  EditorContent: (props: { editor: unknown }) => mocks.editorContentMock(props)
}));

import { RichEditor } from "./rich-editor";
import { QuickInsert } from "./quick-insert";

describe("components/editor/rich-editor.tsx", () => {
  beforeEach(() => {
    mocks.useInlineImageUploadMock.mockReset();
    mocks.useRichEditorInstanceMock.mockReset();
    mocks.useEditorImageInsertionMock.mockReset();
    mocks.useEditorCommandsMock.mockReset();
    mocks.editorToolbarMock.mockReset();
    mocks.editorContentMock.mockReset();
  });

  it("returns null when editor instance is unavailable", () => {
    mocks.useInlineImageUploadMock.mockReturnValue({
      uploadInlineImage: vi.fn(),
      uploadLabel: "Upload image",
      uploadProgress: 0,
      uploading: false,
      uploadsEnabled: true
    });
    mocks.useRichEditorInstanceMock.mockReturnValue({
      editor: null,
      isInTable: false
    });
    mocks.useEditorImageInsertionMock.mockReturnValue({
      fileInputRef: createRef<HTMLInputElement>(),
      triggerImageUpload: vi.fn(),
      handleDrop: vi.fn(),
      handleFileChange: vi.fn()
    });
    mocks.useEditorCommandsMock.mockReturnValue({
      toolbarCommands: [],
      quickInsertCommands: []
    });
    mocks.editorToolbarMock.mockReturnValue(<div>EditorToolbarStub</div>);
    mocks.editorContentMock.mockReturnValue(<div>EditorContentStub</div>);

    const html = renderToStaticMarkup(
      <RichEditor initialContent={null} onChange={() => undefined} />
    );

    expect(html).toBe("");
    expect(mocks.editorToolbarMock).not.toHaveBeenCalled();
    expect(mocks.editorContentMock).not.toHaveBeenCalled();
  });

  it("renders toolbar and editor content when editor is ready", () => {
    const editorInstance = { id: "editor-instance" };
    const fileInputRef = createRef<HTMLInputElement>();
    const handleDrop = vi.fn();
    const handleFileChange = vi.fn();
    const triggerImageUpload = vi.fn();

    mocks.useInlineImageUploadMock.mockReturnValue({
      uploadInlineImage: vi.fn(),
      uploadLabel: "Upload image",
      uploadProgress: 54,
      uploading: true,
      uploadsEnabled: true
    });
    mocks.useRichEditorInstanceMock.mockReturnValue({
      editor: editorInstance,
      isInTable: true
    });
    mocks.useEditorImageInsertionMock.mockReturnValue({
      fileInputRef,
      triggerImageUpload,
      handleDrop,
      handleFileChange
    });
    mocks.useEditorCommandsMock.mockReturnValue({
      toolbarCommands: [{ id: "bold" }],
      quickInsertCommands: [{ id: "heading" }]
    });
    mocks.editorToolbarMock.mockImplementation(
      (props: { toolbarCommands: unknown[]; quickInsertCommands: unknown[] }) => (
        <div>{`EditorToolbarStub:${props.toolbarCommands.length}:${props.quickInsertCommands.length}`}</div>
      )
    );
    mocks.editorContentMock.mockImplementation((props: { editor: { id: string } }) => (
      <div>{`EditorContentStub:${props.editor.id}`}</div>
    ));

    const html = renderToStaticMarkup(
      <RichEditor initialContent={{ type: "doc", content: [] }} onChange={() => undefined} />
    );

    const commandsArgs = mocks.useEditorCommandsMock.mock.calls[0]?.[0] as {
      context: {
        editor: unknown;
        isInTable: boolean;
        upload: {
          label: string;
          uploading: boolean;
          enabled: boolean;
        };
        actions: {
          triggerImageUpload: unknown;
        };
      };
    };

    expect(commandsArgs.context.editor).toBe(editorInstance);
    expect(commandsArgs.context.isInTable).toBe(true);
    expect(commandsArgs.context.upload.label).toBe("Upload image");
    expect(commandsArgs.context.upload.uploading).toBe(true);
    expect(commandsArgs.context.upload.enabled).toBe(true);
    expect(commandsArgs.context.actions.triggerImageUpload).toBe(triggerImageUpload);
    expect(html).toContain("EditorToolbarStub:1:1");
    expect(html).toContain("EditorContentStub:editor-instance");
  });

  it("renders quick-insert command buttons as non-submit controls inside forms", () => {
    const icon = ({ className }: { className?: string }) => <svg className={className} />;
    const quickInsertCommands: EditorCommand[] = [
      {
        id: "heading",
        label: "Heading",
        icon,
        run: vi.fn(),
        surfaces: ["quick-insert"]
      }
    ];

    mocks.useInlineImageUploadMock.mockReturnValue({
      uploadInlineImage: vi.fn(),
      uploadLabel: "Upload image",
      uploadProgress: 0,
      uploading: false,
      uploadsEnabled: true
    });
    mocks.useRichEditorInstanceMock.mockReturnValue({
      editor: { id: "editor-instance" },
      isInTable: false
    });
    mocks.useEditorImageInsertionMock.mockReturnValue({
      fileInputRef: createRef<HTMLInputElement>(),
      triggerImageUpload: vi.fn(),
      handleDrop: vi.fn(),
      handleFileChange: vi.fn()
    });
    mocks.useEditorCommandsMock.mockReturnValue({
      toolbarCommands: [],
      quickInsertCommands
    });
    mocks.editorToolbarMock.mockImplementation(
      (props: { quickInsertCommands: EditorCommand[] }) => (
        <form>
          <QuickInsert commands={props.quickInsertCommands} initialOpen />
        </form>
      )
    );
    mocks.editorContentMock.mockReturnValue(<div>EditorContentStub</div>);

    const html = renderToStaticMarkup(
      <RichEditor initialContent={{ type: "doc", content: [] }} onChange={() => undefined} />
    );

    const buttonTypes = html.match(/type=\"button\"/g) ?? [];
    expect(html).toContain("<form>");
    expect(html).toContain(">Heading<");
    expect(buttonTypes.length).toBeGreaterThanOrEqual(2);
    expect(html).not.toContain("type=\"submit\"");
  });
});
