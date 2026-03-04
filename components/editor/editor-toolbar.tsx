"use client";

import type { RefObject } from "react";
import { QuickInsert } from "@/components/editor/quick-insert";
import type { EditorCommand } from "@/components/editor/commands";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/ui/classnames";

type Props = {
  toolbarCommands: EditorCommand[];
  quickInsertCommands: EditorCommand[];
  fileInputRef: RefObject<HTMLInputElement | null>;
  onFileChange: (file: File) => void;
  uploading: boolean;
  uploadProgress: number;
};

export function EditorToolbar({
  toolbarCommands,
  quickInsertCommands,
  fileInputRef,
  onFileChange,
  uploading,
  uploadProgress
}: Props) {
  return (
    <>
      <div className="floating-toolbar sticky top-20 z-10 flex flex-wrap gap-2 rounded-2xl border border-border/70 bg-card/80 px-3 py-2 shadow-sm backdrop-blur">
        {toolbarCommands.map((command) => {
          const Icon = command.icon;
          return (
            <ToolbarButton
              key={command.id}
              icon={<Icon className="h-4 w-4" />}
              label={command.label}
              onClick={command.run}
              isActive={command.isActive}
              disabled={command.disabled}
            />
          );
        })}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              onFileChange(file);
              event.target.value = "";
            }
          }}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <QuickInsert commands={quickInsertCommands} />
        {uploading && (
          <div className="rounded-xl border border-border/70 bg-muted px-3 py-2 text-xs uppercase tracking-[0.2em] text-foreground/60">
            Uploading image... {uploadProgress}%
          </div>
        )}
      </div>
    </>
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
