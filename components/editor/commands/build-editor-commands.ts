import {
  Bold,
  Columns3,
  Heading2,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  Rows,
  Table as TableIcon,
  Type
} from "lucide-react";
import type { EditorCommandContext } from "./context";
import type { EditorCommand } from "./types";

export function buildEditorCommands({
  editor,
  isInTable,
  actions,
  upload
}: EditorCommandContext): EditorCommand[] {
  const commands: EditorCommand[] = [
    {
      id: "heading-1",
      label: "H1",
      icon: Type,
      surfaces: ["toolbar"],
      run: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      isActive: editor.isActive("heading", { level: 1 })
    },
    {
      id: "heading-2",
      label: "H2",
      icon: Heading2,
      surfaces: ["toolbar", "quick-insert"],
      run: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: editor.isActive("heading", { level: 2 })
    },
    {
      id: "bold",
      label: "Bold",
      icon: Bold,
      surfaces: ["toolbar"],
      run: () => editor.chain().focus().toggleBold().run(),
      isActive: editor.isActive("bold")
    },
    {
      id: "italic",
      label: "Italic",
      icon: Italic,
      surfaces: ["toolbar"],
      run: () => editor.chain().focus().toggleItalic().run(),
      isActive: editor.isActive("italic")
    },
    {
      id: "bullet-list",
      label: "Bullet",
      icon: List,
      surfaces: ["toolbar", "quick-insert"],
      run: () => editor.chain().focus().toggleBulletList().run(),
      isActive: editor.isActive("bulletList")
    },
    {
      id: "ordered-list",
      label: "Numbered",
      icon: ListOrdered,
      surfaces: ["toolbar"],
      run: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: editor.isActive("orderedList")
    },
    {
      id: "blockquote",
      label: "Quote",
      icon: Quote,
      surfaces: ["toolbar", "quick-insert"],
      run: () => editor.chain().focus().toggleBlockquote().run(),
      isActive: editor.isActive("blockquote")
    },
    {
      id: "link",
      label: "Link",
      icon: Link2,
      surfaces: ["toolbar"],
      run: actions.setLink,
      isActive: editor.isActive("link")
    },
    {
      id: "divider",
      label: "Divider",
      icon: Minus,
      surfaces: ["quick-insert"],
      run: () => editor.chain().focus().setHorizontalRule().run()
    },
    {
      id: "table",
      label: "Table",
      icon: TableIcon,
      surfaces: ["toolbar", "quick-insert"],
      run: actions.insertTable
    }
  ];

  if (isInTable) {
    commands.push(
      {
        id: "row-add",
        label: "Row +",
        icon: Rows,
        surfaces: ["toolbar"],
        run: () => editor.chain().focus().addRowAfter().run()
      },
      {
        id: "row-delete",
        label: "Row -",
        icon: Rows,
        surfaces: ["toolbar"],
        run: () => editor.chain().focus().deleteRow().run()
      },
      {
        id: "column-add",
        label: "Col +",
        icon: Columns3,
        surfaces: ["toolbar"],
        run: () => editor.chain().focus().addColumnAfter().run()
      },
      {
        id: "column-delete",
        label: "Col -",
        icon: Columns3,
        surfaces: ["toolbar"],
        run: () => editor.chain().focus().deleteColumn().run()
      },
      {
        id: "table-delete",
        label: "Delete table",
        icon: Minus,
        surfaces: ["toolbar"],
        run: () => editor.chain().focus().deleteTable().run()
      }
    );
  }

  commands.push({
    id: "image-upload",
    label: upload.label,
    icon: ImageIcon,
    surfaces: ["toolbar"],
    run: actions.triggerImageUpload,
    disabled: upload.uploading || !upload.enabled
  });

  return commands;
}
