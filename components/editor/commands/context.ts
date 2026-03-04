import type { Editor } from "@tiptap/react";

export type EditorCommandContext = {
  editor: Editor;
  isInTable: boolean;
  actions: {
    setLink: () => void;
    insertTable: () => void;
    triggerImageUpload: () => void;
  };
  upload: {
    label: string;
    uploading: boolean;
    enabled: boolean;
  };
};
