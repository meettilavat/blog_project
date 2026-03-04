import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const { buildEditorCommandsMock } = vi.hoisted(() => ({
  buildEditorCommandsMock: vi.fn()
}));

vi.mock("@/components/editor/commands", () => ({
  buildEditorCommands: (args: unknown) => buildEditorCommandsMock(args)
}));

import { useEditorCommands } from "./use-editor-commands";

type EditorCommandsHarnessProps = Parameters<typeof useEditorCommands>[0];

function EditorCommandsHarness(props: EditorCommandsHarnessProps) {
  const { toolbarCommands, quickInsertCommands } = useEditorCommands(props);
  return (
    <div>
      {`toolbar:${toolbarCommands.map((command) => command.id).join(",")}|quick:${quickInsertCommands
        .map((command) => command.id)
        .join(",")}`}
    </div>
  );
}

describe("components/editor/use-editor-commands.ts", () => {
  it("returns empty command lists when editor is not ready", () => {
    const html = renderToStaticMarkup(
      <EditorCommandsHarness
        context={null}
      />
    );

    expect(buildEditorCommandsMock).not.toHaveBeenCalled();
    expect(html).toContain("toolbar:|quick:");
  });

  it("splits built commands by toolbar and quick-insert surfaces", () => {
    const editor = { id: "editor-instance" } as never;
    const setLink = vi.fn();
    const insertTable = vi.fn();
    const triggerImageUpload = vi.fn();
    const context = {
      editor,
      isInTable: true,
      actions: {
        setLink,
        insertTable,
        triggerImageUpload
      },
      upload: {
        label: "Uploading image",
        uploading: true,
        enabled: false
      }
    };
    buildEditorCommandsMock.mockReturnValue([
      { id: "bold", surfaces: ["toolbar"] },
      { id: "quote", surfaces: ["toolbar", "quick-insert"] },
      { id: "divider", surfaces: ["quick-insert"] }
    ]);

    const html = renderToStaticMarkup(
      <EditorCommandsHarness
        context={context}
      />
    );

    expect(buildEditorCommandsMock).toHaveBeenCalledWith(context);
    expect(html).toContain("toolbar:bold,quote|quick:quote,divider");
  });
});
