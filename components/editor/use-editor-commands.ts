"use client";

import { useMemo } from "react";
import { buildEditorCommands, type EditorCommandContext } from "@/components/editor/commands";

type UseEditorCommandsOptions = {
  context: EditorCommandContext | null;
};

export function useEditorCommands({ context }: UseEditorCommandsOptions) {
  return useMemo(() => {
    if (!context) {
      return {
        toolbarCommands: [],
        quickInsertCommands: []
      };
    }

    const commands = buildEditorCommands(context);

    return {
      toolbarCommands: commands.filter((command) => command.surfaces.includes("toolbar")),
      quickInsertCommands: commands.filter((command) => command.surfaces.includes("quick-insert"))
    };
  }, [context]);
}
