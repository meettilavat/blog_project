"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

type Theme = "light" | "dark";

export function ThemeToggle() {
  const getInitial = useMemo(
    () => () => {
      if (typeof window === "undefined") return "light" as Theme;
      const stored = window.localStorage.getItem("theme") as Theme | null;
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      return stored ?? (prefersDark ? "dark" : "light");
    },
    []
  );

  const [theme, setTheme] = useState<Theme | null>(null);

  const applyTheme = (value: Theme) => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", value === "dark");
    document.documentElement.dataset.theme = value;
    document.documentElement.style.colorScheme = value;
  };

  useEffect(() => {
    const initial = getInitial();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(initial);
    applyTheme(initial);
  }, [getInitial]);

  useEffect(() => {
    if (!theme) return;
    applyTheme(theme);
  }, [theme]);

  const toggle = () => {
    const next: Theme = theme === "light" ? "dark" : "light";
    setTheme(next);
    applyTheme(next);
    window.localStorage.setItem("theme", next);
  };

  if (!theme) return null;

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="rounded-full border border-border/70 px-3"
      onClick={toggle}
      aria-label="Toggle theme"
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

export default ThemeToggle;
