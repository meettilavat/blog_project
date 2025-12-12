"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import type { JSONContent } from "@tiptap/core";
import {
  Bold,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Type,
  Table as TableIcon,
  Image as ImageIcon,
  Columns3,
  Rows,
  Minus,
  Plus
} from "lucide-react";
import Figure from "@/lib/tiptap/figure";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import QuickInsert from "@/components/editor/quick-insert";

type Props = {
  initialContent: JSONContent | null;
  onChange: (content: JSONContent) => void;
};

const defaultDoc: JSONContent = {
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

export function RichEditor({ initialContent, onChange }: Props) {
  const supabase = useMemo(() => {
    try {
      return createSupabaseBrowserClient();
    } catch (err) {
      console.warn("Supabase is not configured for uploads", err);
      return null;
    }
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadLabel, setUploadLabel] = useState("Image");
  const [isInTable, setIsInTable] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const uploadsEnabled = Boolean(supabase);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        horizontalRule: {}
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
    ],
    content: initialContent ?? defaultDoc,
    editorProps: {
      attributes: {
        class:
          "tiptap text-lg leading-8 max-w-[72ch] mx-auto pb-10"
      }
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON());
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

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href as string | undefined;
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

  const handleFileUpload = useCallback(
    async (file: File) => {
      if (!supabase) {
        alert("Supabase is not configured. Provide env vars to enable uploads.");
        return;
      }
      setUploading(true);
      setUploadLabel("Uploading...");
      setUploadProgress(10);
      const timer = setInterval(() => {
        setUploadProgress((prev) => (prev < 90 ? prev + 5 : prev));
      }, 300);
      const path = `inline/${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
      const { data, error } = await supabase.storage.from("blog-images").upload(path, file, {
        cacheControl: "3600",
        upsert: false
      });
      if (error) {
        console.error("Upload failed", error.message);
        alert("Upload failed. Check your Supabase storage policy.");
        setUploading(false);
        setUploadLabel("Image");
        clearInterval(timer);
        return;
      }
      const { data: publicUrl } = supabase.storage.from("blog-images").getPublicUrl(data.path);
      const caption = window.prompt("Caption for this image?", "") || "";
      editor
        ?.chain()
        .focus()
        .setImage({ src: publicUrl.publicUrl, alt: file.name, caption } as any)
        .run();
      setUploading(false);
      setUploadLabel("Image");
      setUploadProgress(0);
      clearInterval(timer);
    },
    [editor, supabase]
  );

  const triggerImageUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const file = event.dataTransfer.files?.[0];
      if (file && file.type.startsWith("image/")) {
        void handleFileUpload(file);
      }
    },
    [handleFileUpload]
  );

  if (!editor) return null;

  return (
    <div
      className="space-y-4 rounded-3xl border border-border/70 bg-card p-4 shadow-soft"
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
    >
      <div className="floating-toolbar sticky top-20 z-10 flex flex-wrap gap-2 rounded-2xl border border-border/70 bg-card/80 px-3 py-2 shadow-sm backdrop-blur">
        <ToolbarButton
          icon={<Type className="h-4 w-4" />}
          label="H1"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive("heading", { level: 1 })}
        />
        <ToolbarButton
          icon={<Type className="h-4 w-4" />}
          label="H2"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive("heading", { level: 2 })}
        />
        <ToolbarButton
          icon={<Bold className="h-4 w-4" />}
          label="Bold"
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
        />
        <ToolbarButton
          icon={<Italic className="h-4 w-4" />}
          label="Italic"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive("italic")}
        />
        <ToolbarButton
          icon={<List className="h-4 w-4" />}
          label="Bullet"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive("bulletList")}
        />
        <ToolbarButton
          icon={<ListOrdered className="h-4 w-4" />}
          label="Numbered"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive("orderedList")}
        />
        <ToolbarButton
          icon={<Quote className="h-4 w-4" />}
          label="Quote"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive("blockquote")}
        />
        <ToolbarButton
          icon={<Link2 className="h-4 w-4" />}
          label="Link"
          onClick={setLink}
          isActive={editor.isActive("link")}
        />
        <ToolbarButton
          icon={<TableIcon className="h-4 w-4" />}
          label="Table"
          onClick={insertTable}
        />
        {isInTable && (
          <>
            <ToolbarButton
              icon={<Rows className="h-4 w-4" />}
              label="Row +"
              onClick={() => editor.chain().focus().addRowAfter().run()}
            />
            <ToolbarButton
              icon={<Rows className="h-4 w-4" />}
              label="Row -"
              onClick={() => editor.chain().focus().deleteRow().run()}
            />
            <ToolbarButton
              icon={<Columns3 className="h-4 w-4" />}
              label="Col +"
              onClick={() => editor.chain().focus().addColumnAfter().run()}
            />
            <ToolbarButton
              icon={<Columns3 className="h-4 w-4" />}
              label="Col -"
              onClick={() => editor.chain().focus().deleteColumn().run()}
            />
            <ToolbarButton
              icon={<Minus className="h-4 w-4" />}
              label="Delete table"
              onClick={() => editor.chain().focus().deleteTable().run()}
            />
          </>
        )}
        <ToolbarButton
          icon={<ImageIcon className="h-4 w-4" />}
          label={uploadLabel}
          onClick={triggerImageUpload}
          disabled={uploading || !uploadsEnabled}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void handleFileUpload(file);
              event.target.value = "";
            }
          }}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <QuickInsert editor={editor} />
        {uploading && (
          <div className="rounded-xl border border-border/70 bg-muted px-3 py-2 text-xs uppercase tracking-[0.2em] text-foreground/60">
            Uploading image... {uploadProgress}%
          </div>
        )}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

type ToolbarButtonProps = {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick: () => void;
  disabled?: boolean;
};

function ToolbarButton({ icon, label, isActive, onClick, disabled }: ToolbarButtonProps) {
  return (
    <Button
      type="button"
      variant={isActive ? "default" : "ghost"}
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "gap-1 rounded-xl border border-border/70 px-3 text-xs uppercase tracking-[0.2em]",
        isActive && "border-foreground bg-foreground text-white"
      )}
    >
      {icon}
      {label}
    </Button>
  );
}

export default RichEditor;
