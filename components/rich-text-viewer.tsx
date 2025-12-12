"use client";

import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import type { JSONContent } from "@tiptap/core";
import Figure from "@/lib/tiptap/figure";
import { slugify, sanitizeTiptapContent } from "@/lib/utils";

type Props = {
  content: JSONContent | null;
};

export function RichTextViewer({ content }: Props) {
  const safeContent = sanitizeTiptapContent(
    content ?? {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "" }] }]
    }
  );

  const editor = useEditor({
    editable: false,
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: true
      }),
      Placeholder.configure({
        placeholder: "Start writing..."
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
    ],
    content: safeContent
  });

  useEffect(() => {
    if (content && editor) {
      editor.commands.setContent(sanitizeTiptapContent(content));
    }
  }, [content, editor]);

  useEffect(() => {
    if (!editor) return;
    const el = editor.options.element as HTMLElement;
    const headings = el.querySelectorAll("h1, h2, h3");
    headings.forEach((heading) => {
      if (!heading.id) {
        heading.id = slugify(heading.textContent || "");
      }
    });
  }, [editor, content]);

  if (!editor) return null;

  return (
    <EditorContent
      editor={editor}
      className="tiptap max-w-[72ch] mx-auto text-lg leading-8"
    />
  );
}

export default RichTextViewer;
