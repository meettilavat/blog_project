"use client";

import { useState } from "react";
import { Command } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { EditorCommand } from "@/components/editor/commands";

type Props = {
  commands: EditorCommand[];
  initialOpen?: boolean;
};

export function QuickInsert({ commands, initialOpen = false }: Props) {
  const [open, setOpen] = useState(initialOpen);

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-2 uppercase tracking-[0.2em]"
        onClick={() => setOpen((value) => !value)}
      >
        <Command className="h-4 w-4" />
        Quick insert
      </Button>
      {open && (
        <div className="absolute z-20 mt-2 w-52 rounded-2xl border border-border/70 bg-card p-2 shadow-soft">
          {commands.map((command) => {
            const Icon = command.icon;
            return (
              <button
                key={command.id}
                type="button"
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-foreground transition hover:bg-muted"
                onClick={() => {
                  command.run();
                  setOpen(false);
                }}
              >
                <Icon className="h-4 w-4" />
                {command.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
