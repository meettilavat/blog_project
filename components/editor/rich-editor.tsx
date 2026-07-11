"use client";

import { useCallback, useMemo } from "react";
import { EditorContent } from "@tiptap/react";
import { EditorToolbar } from "@/components/editor/editor-toolbar";
import { useEditorCommands } from "@/components/editor/use-editor-commands";
import { useEditorImageInsertion } from "@/components/editor/use-editor-image-insertion";
import { useInlineImageUpload } from "@/components/editor/use-inline-image-upload";
import { useRichEditorInstance } from "@/components/editor/use-rich-editor-instance";
import type { PostContent } from "@/lib/posts/contracts/domain/types";

type Props = {
  initialContent: PostContent;
  onChange: (content: PostContent) => void;
};

export function RichEditor({ initialContent, onChange }: Props) {
  const { uploadInlineImage, uploadLabel, uploadProgress, uploading, uploadsEnabled } =
    useInlineImageUpload();
  const { editor, isInTable } = useRichEditorInstance({
    initialContent,
    onChange
  });

  const setLink = useCallback(() => {
    if (!editor) return;
    const linkAttributes = editor.getAttributes("link");
    const previousUrl = typeof linkAttributes?.href === "string" ? linkAttributes.href : undefined;
    const url = window.prompt("Link URL", previousUrl || "");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().setLink({ href: url }).run();
  }, [editor]);

  const insertTable = useCallback(() => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  const { fileInputRef, triggerImageUpload, handleDrop, handleFileChange } = useEditorImageInsertion({
    editor,
    uploadInlineImage
  });

  const commandContext = useMemo(() => {
    if (!editor) {
      return null;
    }

    return {
      editor,
      isInTable,
      actions: {
        setLink,
        insertTable,
        triggerImageUpload
      },
      upload: {
        label: uploadLabel,
        uploading,
        enabled: uploadsEnabled
      }
    };
  }, [
    editor,
    isInTable,
    setLink,
    insertTable,
    triggerImageUpload,
    uploadLabel,
    uploading,
    uploadsEnabled
  ]);

  const { toolbarCommands, quickInsertCommands } = useEditorCommands({
    context: commandContext
  });

  if (!editor) return null;

  return (
    <div
      className="space-y-4 border-y border-border/70 bg-card/40 py-4"
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
    >
      <EditorToolbar
        toolbarCommands={toolbarCommands}
        quickInsertCommands={quickInsertCommands}
        fileInputRef={fileInputRef}
        onFileChange={handleFileChange}
        uploading={uploading}
        uploadProgress={uploadProgress}
      />
      <EditorContent editor={editor} />
    </div>
  );
}

export default RichEditor;
