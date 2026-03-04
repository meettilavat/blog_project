import { describe, expect, it, vi } from "vitest";
import { buildEditorCommands } from "./build-editor-commands";

function createEditorDouble() {
  const run = vi.fn(() => true);
  const chain = {
    focus: vi.fn(() => chain),
    toggleHeading: vi.fn(() => chain),
    toggleBold: vi.fn(() => chain),
    toggleItalic: vi.fn(() => chain),
    toggleBulletList: vi.fn(() => chain),
    toggleOrderedList: vi.fn(() => chain),
    toggleBlockquote: vi.fn(() => chain),
    setHorizontalRule: vi.fn(() => chain),
    insertTable: vi.fn(() => chain),
    addRowAfter: vi.fn(() => chain),
    deleteRow: vi.fn(() => chain),
    addColumnAfter: vi.fn(() => chain),
    deleteColumn: vi.fn(() => chain),
    deleteTable: vi.fn(() => chain),
    run
  };

  return {
    chain: vi.fn(() => chain),
    isActive: vi.fn(() => false)
  };
}

describe("components/editor/commands/build-editor-commands.ts", () => {
  it("shares heading/table commands across toolbar and quick-insert surfaces", () => {
    const editor = createEditorDouble();
    const commands = buildEditorCommands({
      editor: editor as never,
      isInTable: false,
      actions: {
        setLink: vi.fn(),
        insertTable: vi.fn(),
        triggerImageUpload: vi.fn()
      },
      upload: {
        label: "Image",
        uploading: false,
        enabled: true
      }
    });

    expect(commands.find((command) => command.id === "heading-2")?.surfaces).toEqual([
      "toolbar",
      "quick-insert"
    ]);
    expect(commands.find((command) => command.id === "table")?.surfaces).toEqual([
      "toolbar",
      "quick-insert"
    ]);
  });

  it("adds table row/column commands only when cursor is inside a table", () => {
    const editor = createEditorDouble();

    const outsideTable = buildEditorCommands({
      editor: editor as never,
      isInTable: false,
      actions: {
        setLink: vi.fn(),
        insertTable: vi.fn(),
        triggerImageUpload: vi.fn()
      },
      upload: {
        label: "Image",
        uploading: false,
        enabled: true
      }
    });

    const insideTable = buildEditorCommands({
      editor: editor as never,
      isInTable: true,
      actions: {
        setLink: vi.fn(),
        insertTable: vi.fn(),
        triggerImageUpload: vi.fn()
      },
      upload: {
        label: "Image",
        uploading: false,
        enabled: true
      }
    });

    expect(outsideTable.some((command) => command.id === "row-add")).toBe(false);
    expect(insideTable.some((command) => command.id === "row-add")).toBe(true);
    expect(insideTable.some((command) => command.id === "column-delete")).toBe(true);
  });

  it("marks image upload command disabled when uploads are unavailable", () => {
    const editor = createEditorDouble();

    const commands = buildEditorCommands({
      editor: editor as never,
      isInTable: false,
      actions: {
        setLink: vi.fn(),
        insertTable: vi.fn(),
        triggerImageUpload: vi.fn()
      },
      upload: {
        label: "Uploading...",
        uploading: true,
        enabled: false
      }
    });

    expect(commands.find((command) => command.id === "image-upload")).toMatchObject({
      label: "Uploading...",
      disabled: true
    });
  });
});
