import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { PostContent } from "@/lib/posts/contracts/types";

const mocks = vi.hoisted(() => ({
  useEditorMock: vi.fn(),
  starterKitConfigureMock: vi.fn(),
  placeholderConfigureMock: vi.fn(),
  linkConfigureMock: vi.fn(),
  figureConfigureMock: vi.fn(),
  tableConfigureMock: vi.fn()
}));

vi.mock("@tiptap/react", () => ({
  useEditor: (options: unknown) => mocks.useEditorMock(options)
}));

vi.mock("@tiptap/starter-kit", () => ({
  default: {
    configure: (options: unknown) => mocks.starterKitConfigureMock(options)
  }
}));

vi.mock("@tiptap/extension-placeholder", () => ({
  default: {
    configure: (options: unknown) => mocks.placeholderConfigureMock(options)
  }
}));

vi.mock("@tiptap/extension-link", () => ({
  default: {
    configure: (options: unknown) => mocks.linkConfigureMock(options)
  }
}));

vi.mock("@/lib/tiptap/extensions/figure-extension", () => ({
  default: {
    configure: (options: unknown) => mocks.figureConfigureMock(options)
  }
}));

vi.mock("@tiptap/extension-table", () => ({
  Table: {
    configure: (options: unknown) => mocks.tableConfigureMock(options)
  }
}));

vi.mock("@tiptap/extension-table-row", () => ({
  default: "TableRowExt"
}));

vi.mock("@tiptap/extension-table-header", () => ({
  default: "TableHeaderExt"
}));

vi.mock("@tiptap/extension-table-cell", () => ({
  default: "TableCellExt"
}));

import { useRichEditorInstance } from "./use-rich-editor-instance";

function RichEditorInstanceHarness({
  initialContent,
  onChange
}: {
  initialContent: PostContent;
  onChange: (content: PostContent) => void;
}) {
  const { editor, isInTable } = useRichEditorInstance({
    initialContent,
    onChange
  });
  return <div>{`editor:${editor ? "ready" : "none"}|isInTable:${String(isInTable)}`}</div>;
}

describe("components/editor/use-rich-editor-instance.ts", () => {
  beforeEach(() => {
    mocks.useEditorMock.mockReset();
    mocks.starterKitConfigureMock.mockReset();
    mocks.placeholderConfigureMock.mockReset();
    mocks.linkConfigureMock.mockReset();
    mocks.figureConfigureMock.mockReset();
    mocks.tableConfigureMock.mockReset();

    mocks.starterKitConfigureMock.mockReturnValue("StarterKitExt");
    mocks.placeholderConfigureMock.mockReturnValue("PlaceholderExt");
    mocks.linkConfigureMock.mockReturnValue("LinkExt");
    mocks.figureConfigureMock.mockReturnValue("FigureExt");
    mocks.tableConfigureMock.mockReturnValue("TableExt");
  });

  it("builds editor with default content and update callback wiring", () => {
    const onChange = vi.fn();
    mocks.useEditorMock.mockReturnValue(null);

    const html = renderToStaticMarkup(<RichEditorInstanceHarness initialContent={null} onChange={onChange} />);
    const editorOptions = mocks.useEditorMock.mock.calls[0]?.[0] as {
      immediatelyRender: boolean;
      content: unknown;
      editorProps: { attributes: { class: string } };
      onUpdate: (args: { editor: { getJSON: () => PostContent } }) => void;
    };

    expect(html).toContain("editor:none|isInTable:false");
    expect(editorOptions.immediatelyRender).toBe(false);
    expect(editorOptions.content).toEqual({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Start writing with care for negative space."
            }
          ]
        }
      ]
    });
    expect(editorOptions.editorProps.attributes.class).toContain("tiptap");

    editorOptions.onUpdate({
      editor: {
        getJSON: () => ({ type: "doc", content: [] })
      }
    });
    expect(onChange).toHaveBeenCalledWith({ type: "doc", content: [] });
    expect(mocks.starterKitConfigureMock).toHaveBeenCalledWith({
      heading: { levels: [1, 2, 3] },
      horizontalRule: {},
      link: false
    });
    expect(mocks.placeholderConfigureMock).toHaveBeenCalledWith({
      placeholder: "A blank page with Swiss quietude..."
    });
    expect(mocks.linkConfigureMock).toHaveBeenCalledWith({
      openOnClick: false,
      linkOnPaste: true,
      autolink: true
    });
    expect(mocks.figureConfigureMock).toHaveBeenCalledWith({
      allowBase64: true
    });
    expect(mocks.tableConfigureMock).toHaveBeenCalledWith({
      resizable: false
    });
  });

  it("uses provided initial content and returns editor instance", () => {
    const onChange = vi.fn();
    const editorInstance = {
      on: vi.fn(),
      off: vi.fn(),
      isActive: vi.fn().mockReturnValue(false)
    };
    mocks.useEditorMock.mockReturnValue(editorInstance);

    const html = renderToStaticMarkup(
      <RichEditorInstanceHarness
        initialContent={{ type: "doc", content: [{ type: "paragraph", content: [] }] }}
        onChange={onChange}
      />
    );
    const editorOptions = mocks.useEditorMock.mock.calls[0]?.[0] as {
      content: unknown;
    };

    expect(html).toContain("editor:ready|isInTable:false");
    expect(editorOptions.content).toEqual({
      type: "doc",
      content: [{ type: "paragraph", content: [] }]
    });
  });
});
