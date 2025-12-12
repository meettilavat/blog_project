"use client";

import { useState } from "react";
import { Command, Heading2, Quote, List, Table as TableIcon, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Editor } from "@tiptap/react";

type Props = {
  editor: Editor;
};

const items = [
  { label: "Heading 2", icon: Heading2, action: (e: Editor) => e.chain().focus().toggleHeading({ level: 2 }).run() },
  { label: "Block quote", icon: Quote, action: (e: Editor) => e.chain().focus().toggleBlockquote().run() },
  { label: "Bulleted list", icon: List, action: (e: Editor) => e.chain().focus().toggleBulletList().run() },
  { label: "Divider", icon: Minus, action: (e: Editor) => e.chain().focus().setHorizontalRule().run() },
  { label: "Table", icon: TableIcon, action: (e: Editor) => e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() }
];

export function QuickInsert({ editor }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-2 uppercase tracking-[0.2em]"
        onClick={() => setOpen((v) => !v)}
      >
        <Command className="h-4 w-4" />
        Quick insert
      </Button>
      {open && (
        <div className="absolute z-20 mt-2 w-52 rounded-2xl border border-border/70 bg-card p-2 shadow-soft">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-foreground transition hover:bg-muted"
                onClick={() => {
                  item.action(editor);
                  setOpen(false);
                }}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default QuickInsert;
