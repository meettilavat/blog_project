import type { LucideIcon } from "lucide-react";

export type EditorCommandSurface = "toolbar" | "quick-insert";

export type EditorCommand = {
  id: string;
  label: string;
  icon: LucideIcon;
  surfaces: EditorCommandSurface[];
  run: () => void;
  isActive?: boolean;
  disabled?: boolean;
};
