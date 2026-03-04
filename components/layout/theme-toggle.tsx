"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/ui/classnames";

type ThemeToggleProps = {
  className?: string;
};

function ThemeToggle({ className }: ThemeToggleProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn("rounded-full border border-border/70 px-3", className)}
      data-theme-toggle
      aria-label="Toggle theme"
    >
      <span className="dark:hidden" aria-hidden="true">
        <Moon className="h-4 w-4" />
      </span>
      <span className="hidden dark:inline-flex" aria-hidden="true">
        <Sun className="h-4 w-4" />
      </span>
    </Button>
  );
}

export default ThemeToggle;
