"use client";

import { useEffect, useState } from "react";
import type { JSONContent } from "@tiptap/core";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import { Table } from "@tiptap/extension-table";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Figure from "@/lib/tiptap/extensions/figure-extension";
import type { PostContent } from "@/lib/posts/contracts/domain/types";
import {
  toPostContent,
  toRichContentValue
} from "@/lib/posts/contracts/domain/content-adapter";

const DEFAULT_DOC: JSONContent = {
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
};

type UseRichEditorInstanceOptions = {
  initialContent: PostContent;
  onChange: (content: PostContent) => void;
};

function buildEditorExtensions() {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      horizontalRule: {},
      link: false
    }),
    Placeholder.configure({
      placeholder: "A blank page with Swiss quietude..."
    }),
    Link.configure({
      openOnClick: false,
      linkOnPaste: true,
      autolink: true
    }),
    Figure.configure({
      allowBase64: true
    }),
    Table.configure({
      resizable: false
    }),
    TableRow,
    TableHeader,
    TableCell
  ];
}

export function useRichEditorInstance({ initialContent, onChange }: UseRichEditorInstanceOptions) {
  const [isInTable, setIsInTable] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: buildEditorExtensions(),
    content: toRichContentValue(initialContent) ?? DEFAULT_DOC,
    editorProps: {
      attributes: {
        class: "tiptap text-lg leading-8 max-w-[72ch] mx-auto pb-10"
      }
    },
    onUpdate: ({ editor }) => {
      onChange(toPostContent(editor.getJSON()));
    }
  });

  useEffect(() => {
    if (!editor) return;
    const updateTableState = () => setIsInTable(editor.isActive("table"));
    editor.on("selectionUpdate", updateTableState);
    editor.on("transaction", updateTableState);
    updateTableState();
    return () => {
      editor.off("selectionUpdate", updateTableState);
      editor.off("transaction", updateTableState);
    };
  }, [editor]);

  return {
    editor,
    isInTable
  };
}
